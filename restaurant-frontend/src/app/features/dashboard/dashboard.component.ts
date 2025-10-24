import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef, computed, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
  import { RestaurantApiService } from '../../core/services/restaurant-api.service';
  import { ReservationService } from '../../core/services/reservation.service';
  import { ToastService } from '../../core/services/toast.service';
  import { ConfirmationModalComponent, ConfirmationModalData } from '../../shared/components/confirmation-modal/confirmation-modal.component';
  import { 
    Table,
  DashboardStats, 
  TableSection, 
  DashboardTableData, 
  DashboardSectionSummary
} from '../../shared/interfaces';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    FormsModule,
    ConfirmationModalComponent
  ],
  styleUrl: './dashboard.component.scss',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  // ===== COMPONENT PROPERTIES =====
  
  tables: DashboardTableData[] = [];
  tableSectionKeys: string[] = [];
  currentSection: string = '';
  sectionSummary: DashboardSectionSummary[] = [];
  tableSections: { [key: string]: DashboardTableData[] } = {};
  currentSectionTables: DashboardTableData[] = [];
  dashboardStats: DashboardStats = {
    total_tables: 0,
    occupied_tables: 0,
    available_tables: 0,
    reserved_tables: 0,
    total_orders: 0,
    active_orders: 0,
    revenue_today: 0,
    total_revenue: 0
  };
  
  // UI state
  showSectionOverview = true;
  showTablesOverview = true;
  showReservations = true;
  activeTab: 'available' | 'occupied' | 'reserved' = 'available';
  loadingReservations = false;
  loading = true;
  
  // Modal state
  showViewModal = false;
  selectedReservation: any = null;

  // Computed signals for reactive user data
  userName = computed(() => this.authService.user()?.user_name || 'User');

  // Force reset loadingReservations to boolean
  ngAfterViewInit() {
    this.loadingReservations = false;
  }

  ngOnDestroy() {
    // Clear timeout to prevent memory leaks
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }
  }

  // Reservation properties
  dashboardReservations = signal<any[]>([]);
  reservationDateFilter = '';
  reservationStatusFilter = '';
  reservationCustomerFilter = '';
  private filterTimeout: any;
  
  // Pagination for reservations
  reservationCurrentPage = signal<number>(1);
  reservationPageSize = signal<number>(5);
  reservationTotalPages = signal<number>(1);
  reservationTotalCount = signal<number>(0);
  
  // Paginated reservations (computed)
  paginatedReservations = computed(() => {
    const reservations = this.dashboardReservations();
    const currentPage = this.reservationCurrentPage();
    const pageSize = this.reservationPageSize();
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return reservations.slice(startIndex, endIndex);
  });
  
  // Delete confirmation modal
  deleteModalData: ConfirmationModalData = {
    title: 'Delete Reservation',
    message: 'Are you sure you want to delete this reservation?',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger',
    showIcon: true
  };
  reservationToDelete: any = null;
  
  @ViewChild('deleteModal') deleteModal!: ConfirmationModalComponent;
  
  // Table section management
  Math = Math;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private restaurantApi: RestaurantApiService,
      private reservationService: ReservationService,
      public authService: AuthService,
      private cdr: ChangeDetectorRef,
      private toastService: ToastService
    ) {}

  async ngOnInit() {
    // Set loading to false immediately to show content
    this.loading = false;
    
    // Check if server is reachable before loading data
    const isServerReachable = await this.authService.validateTokenWithServer();
    if (!isServerReachable) {
      // Server is down, user will be redirected to login
      return;
    }
    
    // Load data only if server is reachable
    this.loadDashboardData();
    this.loadDashboardReservations();
    
    // Initialize user activity tracking
    this.initializeUserActivityTracking();
    
    // Listen for query parameter changes (for refresh after reservation deletion)
    this.route.queryParams.subscribe(params => {
      if (params['refresh']) {
        // Force refresh when coming from reservation deletion
        setTimeout(() => {
          this.loadDashboardData();
          this.loadDashboardReservations();
        }, 100);
      }
    });
  }

  // Tab management
  setActiveTab(tab: 'available' | 'occupied' | 'reserved') {
    this.activeTab = tab;
  }

  getCurrentTabTables(): DashboardTableData[] {
    if (this.activeTab === 'available') {
      return this.trulyAvailableTables;
    } else if (this.activeTab === 'occupied') {
      return this.currentSectionTables.filter(table => table.is_occupied);
    } else if (this.activeTab === 'reserved') {
      return this.reservedTables;
    }
    return [];
  }

  async loadDashboardData() {
    try {
      this.loading = true;
      // Load tables first
      await this.loadTables();
      
      // Load other data in parallel
      await Promise.all([
        this.loadDashboardStats(),
        this.loadSectionSummary(), // Now tables data is available
      ]);
    } catch (error) {
      console.error('Dashboard data loading error:', error);
      // Don't redirect to login here, just log the error
    } finally {
      this.loading = false;
      // Trigger change detection after data loading
      this.cdr.detectChanges();
    }
  }

  async loadDashboardReservations() {
    this.loadingReservations = true;
    try {
      const response = await firstValueFrom(this.reservationService.getAllReservations(1, 100));

      if (response?.success) {
        // getAllReservations returns data directly as array
        let reservations = Array.isArray(response.data) ? response.data : [];
        
        // Ensure status field exists and check for overdue reservations
        reservations = reservations.map(reservation => {
          // If status is missing, try to get it from reservation_status or set default
          if (!reservation.status) {
            reservation.status = reservation.reservation_status || 'confirmed';
          }
          
          // Check and update overdue reservations
          if (reservation.status === 'confirmed' && this.checkIfOverdue(reservation)) {
            reservation.status = 'overdue';
          }
          
          return reservation;
        });
        
        // Sort reservations by date and time (nearest first)
        reservations.sort((a, b) => {
          const dateTimeA = new Date(`${a.reservation_date}T${a.reservation_time}`).getTime();
          const dateTimeB = new Date(`${b.reservation_date}T${b.reservation_time}`).getTime();
          return dateTimeA - dateTimeB;
        });
        
        this.dashboardReservations.set(reservations);
        this.updateReservationPagination(reservations.length);
      } else {
        this.dashboardReservations.set([]);
        this.updateReservationPagination(0);
      }
    } catch (error) {
      this.dashboardReservations.set([]);
      this.updateReservationPagination(0);
    } finally {
      this.loadingReservations = false;
      // Trigger change detection after reservations loading
      this.cdr.detectChanges();
    }
  }
  
  updateReservationPagination(totalCount: number) {
    this.reservationTotalCount.set(totalCount);
    const totalPages = Math.ceil(totalCount / this.reservationPageSize());
    this.reservationTotalPages.set(totalPages);
    
    // Reset to page 1 if current page exceeds total pages
    if (this.reservationCurrentPage() > totalPages && totalPages > 0) {
      this.reservationCurrentPage.set(1);
    }
  }
  
  goToReservationPage(page: number) {
    if (page >= 1 && page <= this.reservationTotalPages()) {
      this.reservationCurrentPage.set(page);
    }
  }
  
  nextReservationPage() {
    if (this.reservationCurrentPage() < this.reservationTotalPages()) {
      this.reservationCurrentPage.update(p => p + 1);
    }
  }
  
  previousReservationPage() {
    if (this.reservationCurrentPage() > 1) {
      this.reservationCurrentPage.update(p => p - 1);
    }
  }

  applyReservationFilters() {
    // Clear existing timeout
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }
    
    // Set new timeout for debouncing
    this.filterTimeout = setTimeout(() => {
      this.executeFilter();
    }, 300); // 300ms debounce
  }

  private executeFilter() {
    this.loadingReservations = true;
    const filters: any = {};

    if (this.reservationDateFilter) {
      filters.date = this.reservationDateFilter;
    }
    if (this.reservationStatusFilter) {
      filters.status = this.reservationStatusFilter;
    }
    if (this.reservationCustomerFilter) {
      filters.customer_name = this.reservationCustomerFilter;
    }

    this.reservationService.getAdvancedFilteredReservations(filters).subscribe({
      next: (response) => {
        if (response?.success && response?.data) {
          let reservations = Array.isArray(response.data) ? response.data : [];
          
          // Ensure status field exists for each reservation
          reservations = reservations.map(reservation => {
            // Use reservation_status from backend as primary source
            if (!reservation.status && reservation.reservation_status) {
              reservation.status = reservation.reservation_status;
            }
            
            // Double-check overdue status on frontend (in case backend hasn't updated yet)
            if (reservation.status === 'confirmed' && this.checkIfOverdue(reservation)) {
              reservation.status = 'overdue';
            }
            
            return reservation;
          });
          
          // Sort reservations by date and time (nearest first)
          reservations.sort((a, b) => {
            const dateTimeA = new Date(`${a.reservation_date}T${a.reservation_time}`).getTime();
            const dateTimeB = new Date(`${b.reservation_date}T${b.reservation_time}`).getTime();
            return dateTimeA - dateTimeB;
          });
          
          this.dashboardReservations.set(reservations);
          this.updateReservationPagination(reservations.length);
        } else {
          this.dashboardReservations.set([]);
          this.updateReservationPagination(0);
        }
        this.loadingReservations = false;
        
        // Force change detection after successful response
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.dashboardReservations.set([]);
        this.updateReservationPagination(0);
        this.loadingReservations = false;
        // Trigger change detection after error
        this.cdr.detectChanges();
      }
    });
  }

  clearReservationFilters() {
    // Clear timeout if exists
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }
    
    this.reservationDateFilter = '';
    this.reservationStatusFilter = '';
    this.reservationCustomerFilter = '';
    this.reservationCurrentPage.set(1); // Reset to page 1
    this.loadDashboardReservations();
  }

  // Check if reservation is overdue (past its time)
  isOverdue(reservation: any): boolean {
    if (!reservation || reservation.status !== 'confirmed') return false;
    
    const now = new Date();
    let reservationTime: Date;
    
    if (reservation.reservation_date && reservation.reservation_time) {
      reservationTime = new Date(`${reservation.reservation_date}T${reservation.reservation_time}`);
    } else if (reservation.formatted_date && reservation.formatted_time) {
      const [day, month, year] = reservation.formatted_date.split('/');
      const [hour, minute] = reservation.formatted_time.split(':');
      reservationTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
    } else {
      return false;
    }
    
    if (isNaN(reservationTime.getTime())) return false;
    
    const timeDiff = reservationTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    // Overdue if past reservation time
    return minutesDiff < 0;
  }

  // Check if customer can be seated (within 15 minutes of reservation time or overdue)
  canSeatCustomer(reservation: any): boolean {
    if (!reservation) return false;

    // Can seat if status is overdue
    if (reservation.status === 'overdue') {
      return true;
    }
    
    // Can seat if status is confirmed and within 15 minutes of reservation time
    if (reservation.status === 'confirmed') {
      const now = new Date();
      
      // Try different date formats from backend
      let reservationTime: Date;
      if (reservation.reservation_date && reservation.reservation_time) {
        reservationTime = new Date(`${reservation.reservation_date}T${reservation.reservation_time}`);
      } else if (reservation.formatted_date && reservation.formatted_time) {
        // Try formatted date (DD/MM/YYYY) and time (HH:MM)
        const [day, month, year] = reservation.formatted_date.split('/');
        const [hour, minute] = reservation.formatted_time.split(':');
        reservationTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
      } else {
        return false;
      }
      
      const timeDiff = reservationTime.getTime() - now.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      
      // Can seat if reservation time is within 15 minutes (before or after)
      return minutesDiff <= 15 && minutesDiff >= -15;
    }

    return false;

  }

  // Seat customer
  async seatCustomer(reservation: any) {
    if (!reservation) return;

    try {
      // 1. Check table availability first
      const tableResponse = await firstValueFrom(
        this.restaurantApi.getTableById(reservation.table_id)
      );

      if (!tableResponse?.success || !tableResponse.data) {
        this.toastService.error('Table Error', 'Could not verify table availability');
        return;
      }

      const table = tableResponse.data;
      if (table.is_occupied || table.table_status === 'occupied') {
        this.toastService.error('Table Occupied', 'This table is already occupied. Please check table status or assign a different table.');
        return;
      }

      // 2. Clear any existing customer data from table first
      try {
        const clearResponse = await firstValueFrom(
          this.restaurantApi.clearTableCustomer(reservation.table_id)
        );
      } catch (clearError) {
        this.toastService.error('Clear Failed', 'Failed to clear existing customer data from table');
        return;
      }

      // 3. Call backend to seat customer
      const seatResponse = await firstValueFrom(
        this.restaurantApi.seatCustomer(reservation.table_id, reservation.customer_id)
      );

      if (!seatResponse?.success) {
        this.toastService.error('Seating Failed', seatResponse?.message || 'Failed to seat the customer');
        return;
      }

      // 4. Update reservation status to 'completed'
      const updateResponse = await firstValueFrom(
        this.reservationService.updateReservation(reservation.reservation_id, {
          status: 'completed'
        })
      );

      if (!updateResponse?.success) {
        this.toastService.error('Status Update Failed', updateResponse?.message || 'Customer seated but failed to update reservation status');
        return;
      }

      // 5. Show success message
      this.toastService.success('Customer Seated', 'Customer has been seated and reservation completed');
      
      // 6. Close modal and refresh data
      this.closeViewModal();
      this.loadDashboardReservations();
      this.loadDashboardData();
      
      // 7. Refresh table data to show updated customer info
      this.loadTables();
      
      // 8. Navigate to table detail page
      this.router.navigate(['/table', reservation.table_id], { queryParams: { tab: 'status' } });

    } catch (error: any) {
      this.toastService.error('Error', error.message || 'Failed to seat customer');
    }
  }

  // Navigation methods for reservations
  navigateToReservationDetail(reservation: any) {
    if (reservation?.reservation_id) {
      this.selectedReservation = reservation;
      this.showViewModal = true;
    } 
  }

  // Edit reservation
  editReservation(reservation: any) {
    if (reservation?.reservation_id) {
      this.router.navigate(['/reservations/edit', reservation.reservation_id]);
    }
  }

  // Show delete confirmation modal
  showDeleteConfirmation(reservation: any) {
    if (!reservation?.reservation_id) return;
    
    this.reservationToDelete = reservation;
    this.deleteModalData = {
      ...this.deleteModalData,
      message: `Are you sure you want to delete the reservation for <strong>${reservation.customer_name}</strong>?<br><br>This action cannot be undone.`
    };
    
    // Show modal
    this.deleteModal.show();
  }

  // Delete reservation (called from modal)
  async confirmDelete() {
    if (!this.reservationToDelete?.reservation_id) return;

    try {
      const response = await firstValueFrom(
        this.reservationService.deleteReservation(this.reservationToDelete.reservation_id)
      );

      if (response?.success) {
        // Update table status to available and clear customer data
        try {
          await firstValueFrom(
            this.restaurantApi.updateTableStatus(this.reservationToDelete.table_id, {
              is_occupied: false,
              is_reserved: false,
              table_status: 'available'
            })
          );
          
          // Clear customer data from table
          await firstValueFrom(
            this.restaurantApi.clearTableCustomer(this.reservationToDelete.table_id)
          );
        } catch (tableError) {
        }

        this.toastService.success('Success', 'Reservation deleted successfully and table made available');
        this.loadDashboardReservations();
        await this.loadTables(); // Reload tables to update their status
        
        // Force UI update for tables overview and reserved tables
        setTimeout(() => {
          this.groupTablesBySection();
          // Force change detection to update reserved tables count
          this.cdr.detectChanges();
        }, 100);
      } else {
        this.toastService.error('Error', response?.message || 'Failed to delete reservation');
      }
    } catch (error) {
      this.toastService.error('Error', 'Failed to delete reservation');
    } finally {
      this.reservationToDelete = null;
      this.deleteModal.hide();
    }
  }

  // Cancel delete
  cancelDelete() {
    this.reservationToDelete = null;
    this.deleteModal.hide();
  }

  viewReservation(reservation: any) {
    if (reservation?.reservation_id) {
      this.selectedReservation = reservation;
      this.showViewModal = true;
    } 
  }

  // Modal methods
  closeViewModal() {
    this.showViewModal = false;
    this.selectedReservation = null;
  }




  navigateToTable(tableId: string) {
    if (tableId) {
      this.router.navigate(['/table', tableId], { queryParams: { tab: 'orders' } });
    }
  }

  // Check if reservation is overdue (same logic as reservation-detail)
  checkIfOverdue(reservation: any): boolean {
    const now = new Date();
    let reservationTime: Date;
    
    if (reservation.reservation_date && reservation.reservation_time) {
      reservationTime = new Date(`${reservation.reservation_date}T${reservation.reservation_time}`);
    } else if (reservation.formatted_date && reservation.formatted_time) {
      const [day, month, year] = reservation.formatted_date.split('/');
      const [hour, minute] = reservation.formatted_time.split(':');
      reservationTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
    } else {
      return false;
    }
    
    const timeDiff = reservationTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    // Reservation is overdue if it's more than 1 second past the reservation time
    return minutesDiff < 0;
  }

  // Utility methods for UI
  trackByReservationId(index: number, reservation: any): string {
    return reservation.reservation_id || index.toString();
  }

  getCustomerInitial(customerName?: string): string {
    if (!customerName) return '👤';
    return customerName.charAt(0).toUpperCase();
  }

  getStatusIcon(status?: string): string {
    switch (status) {
      case 'confirmed': return '✓';
      case 'completed': return '✅';
      case 'seated': return '👥';
      case 'overdue': return '⏰';
      default: return '⏳';
    }
  }

  getStatusText(status?: string): string {
    if (!status) return '';
    const statusMap: { [key: string]: string } = {
      'confirmed': 'Confirmed',
      'completed': 'Completed',
      'seated': 'Seated',
      'overdue': 'Overdue'
    };
    return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
  }

  getReservationItemClass(reservation: any): string {
    return `reservation-item ${reservation.status || 'unknown'}`;
  }

  async loadTables() {
    try {
      const response = await firstValueFrom(this.restaurantApi.getTables());
      
      if (response?.success && response?.data) {
        this.tables = response.data.map((t: Table) => this.normalizeTableData(t));
        
        this.groupTablesBySection();
      } else {
        this.tables = [];
      }
    } catch (error) {
      console.error('Failed to load tables:', error);
      this.tables = [];
      this.groupTablesBySection();
    }
  }

  async loadDashboardStats() {
    try {

      const response = await firstValueFrom(this.restaurantApi.getDashboardStats());
      
      
      if (response?.success && response?.data) {
        // Convert string values from backend to numbers
        const data = response.data as DashboardStats;
        
        this.dashboardStats = {
          total_tables: Number(data.total_tables) || this.tables.length || 0,
          occupied_tables: Number(data.occupied_tables) || 0,
          available_tables: Number(data.available_tables) || 0,
          reserved_tables: Number(data.reserved_tables) || 0,
          total_orders: Number(data.active_orders) || 0,
          active_orders: Number(data.active_orders) || 0,
          revenue_today: 0,
          total_revenue: 0
        };

      }
    } catch (error) {
      // Dashboard stats error doesn't stop dashboard from working
      // Local calculation methods used as fallback
      this.dashboardStats = {
        total_tables: 0,
        occupied_tables: 0,
        available_tables: 0,
        reserved_tables: 0,
        total_orders: 0,
        active_orders: 0,
        revenue_today: 0,
        total_revenue: 0
      };
    }
  }

  async loadSectionSummary() {
    try {
      const response = await firstValueFrom(this.restaurantApi.getTableSections());
      if (response?.success && response?.data) {
        // Use data directly from backend
        const rawData = response.data as TableSection[];
        
        this.sectionSummary = rawData.map(section => {
          // Calculate occupied and available tables for this section
          const sectionTables = this.tables.filter(table => 
            this.getSectionKey(table.table_id) === section.section_code
          );
          
          const occupiedTables = sectionTables.filter(table => table.is_occupied).length;
          const availableTables = sectionTables.filter(table => !table.is_occupied).length;
          // Use reserved_tables from backend section data
          const reservedTables = section.reserved_tables || 0;
          
          const sectionData = {
            section_code: section.section_code,
            section_name: section.section_code,
            total_tables: section.total_tables || 0,
            occupied_tables: occupiedTables,
            available_tables: availableTables,
            reserved_tables: reservedTables
          };
          return sectionData;
        });
      }
    } catch (error) {
      this.sectionSummary = [];
    }
  }

  groupTablesBySection() {
    this.tableSections = {};
    
    this.tables.forEach(table => {
      const sectionKey = this.getSectionKey(table.table_id);
      if (!this.tableSections[sectionKey]) {
        this.tableSections[sectionKey] = [];
      }
      this.tableSections[sectionKey].push(table);
    });

    this.tableSectionKeys = Object.keys(this.tableSections).sort();
    if (this.tableSectionKeys.length > 0 && !this.currentSection) {
      this.currentSection = this.tableSectionKeys[0];
    }
    this.updateCurrentSectionTables();
  }

  getSectionKey(tableId: string): string {
    return tableId.split('-')[0];
  }

  updateCurrentSectionTables() {
    if (this.currentSection && this.tableSections[this.currentSection]) {
      this.currentSectionTables = this.tableSections[this.currentSection];
    } else {
      this.currentSectionTables = [];
    }
  }

  onSectionChange() {
    this.updateCurrentSectionTables();
  }



  // Computed properties
  get availableTables(): DashboardTableData[] {
    return this.trulyAvailableTables;
  }

  get occupiedTables(): DashboardTableData[] {
    return this.currentSectionTables.filter(table => table.is_occupied);
  }

  // Available tables excluding reserved ones
  get trulyAvailableTables(): DashboardTableData[] {
    const available = this.currentSectionTables.filter(table => {
      // Not occupied and not reserved
      if (table.is_occupied) return false;
      if (table.table_status === 'reserved') return false;
      return true;
    });
    return available;
  }

  // Reserved tables (should be counted as available)
  get reservedTables(): DashboardTableData[] {
    const reserved = this.currentSectionTables.filter(table => {
      // Check if table is not occupied and has reserved status
      if (table.is_occupied) return false;
      
      // Use table_status from backend
      return table.table_status === 'reserved';
    });
    return reserved;
  }

  // ===== New computed totals across all sections =====
  get totalReservedCount(): number {
    const reservedTables = this.tables.filter(t => {
      // Check if table is not occupied and has reserved status
      if (t.is_occupied) return false;
      
      // Use table_status from backend
      return t.table_status === 'reserved';
    });

    
    return reservedTables.length;
  }

  get totalOccupiedCount(): number {
    return this.tables.filter(t => t.is_occupied).length;
  }

  get totalAvailableCount(): number {
    // Available includes unoccupied tables (reserved or not)
    return this.tables.filter(t => !t.is_occupied).length;
  }

  get hasAvailableTables(): boolean {
    return this.availableTables.length > 0;
  }

  get hasOccupiedTables(): boolean {
    return this.occupiedTables.length > 0;
  }

  get hasReservedTables(): boolean {
    return false; // is_reserved removed from backend
  }

  // Table status helpers
  getTableStatusText(table: DashboardTableData): string {
    if (table.is_occupied) return 'Occupied';
    
    // Use table_status from backend
    if (table.table_status === 'reserved') {
      return 'Reserved';
    }
    
    return 'Available';
  }

  getTableStatusClass(table: DashboardTableData): string {
    if (table.is_occupied) return 'occupied';
    
    // Use table_status from backend
    if (table.table_status === 'reserved') {
      return 'reserved';
    }
    
    return 'available';
  }

  getSectionStatusClass(section: DashboardSectionSummary): string {
    const totalTables = section.total_tables;
    const occupiedTables = section.occupied_tables;
    const availableTables = section.available_tables;
    
    // Calculate occupancy percentage (occupied / total)
    const occupancyRate = (occupiedTables / totalTables) * 100;
    
    
    
    if (occupancyRate === 0) {
      return 'all-available'; // 🟢 Green: All Available (0%)
    } else if (occupancyRate <= 55) {
      return 'moderate'; // 🔵 Blue: Moderate (1-25%)
    } else if (occupancyRate <= 75) {
      return 'busy'; // 🟡 Yellow: Busy (26-75%)
    } else {
      return 'occupied'; // 🔴 Red: Occupied (76-100%)
    }
  }

  getSectionStatusText(section: DashboardSectionSummary): string {
    const totalTables = section.total_tables;
    const occupiedTables = section.occupied_tables;
    const availableTables = section.available_tables;
    
    // Calculate occupancy percentage
    const occupancyRate = (occupiedTables / totalTables) * 100;
    
    if (occupancyRate === 0) {
      return 'All Available'; // 🟢
    } else if (occupancyRate <= 50) {
      return 'Moderate'; // 🔵
    } else if (occupancyRate <= 75) {
      return 'Busy'; // 🟡
    } else {
      return 'Occupied'; // 🔴
    }
  }

  // Data normalization
  normalizeTableData(table: Table): DashboardTableData {
    return {
      ...table,
      occupied_duration_minutes: table.occupied_duration_minutes ? parseFloat(table.occupied_duration_minutes.toString()) : undefined,
      order_item_count: table.order_item_count ? parseInt(table.order_item_count.toString()) : undefined,
      total_amount: table.total_amount ? parseFloat(table.total_amount.toString()) : undefined
    };
  }

  // UI toggle methods
  toggleSectionOverview() {
    this.showSectionOverview = !this.showSectionOverview;
  }

  toggleTablesOverview() {
    this.showTablesOverview = !this.showTablesOverview;
  }

  // Scroll position preservation
  preserveScrollPosition() {
    // This method is no longer needed as reservations are removed
  }


  private initializeUserActivityTracking() {
    // Initialize user activity timestamp
    (window as any).lastUserActivity = Date.now();
    
    // Add event listeners for user activity
    const trackActivity = () => {
      (window as any).lastUserActivity = Date.now();
    };
    
    document.addEventListener('click', trackActivity);
    document.addEventListener('keydown', trackActivity);
    document.addEventListener('mousemove', trackActivity);
    document.addEventListener('scroll', trackActivity);
  }
}
