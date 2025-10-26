import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ReservationService } from '../../core/services/reservation.service';
import { CustomerService } from '../../core/services/customer.service';
import { RestaurantApiService } from '../../core/services/restaurant-api.service';
import { ToastService } from '../../core/services/toast.service';
import { Reservation, ApiResponse, Table } from '../../shared/interfaces';

@Component({
  standalone: true,
  selector: 'app-reservation-detail',
  imports: [CommonModule],
  template: `
    <div class="reservation-detail">
      <div class="header">
        <button class="back-btn" (click)="goToDashboard()">
          <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9,22 9,12 15,12 15,22"/>
          </svg>
          Back to Dashboard
        </button>
        <h1>📅 Reservation Details</h1>
      </div>

      <div class="loading" *ngIf="loading()">
        <div class="spinner">⏳</div>
        <p>Loading reservation...</p>
      </div>

      <div class="error" *ngIf="error()">
        <div class="error-icon">❌</div>
        <h3>Error!</h3>
        <p>{{ error() }}</p>
        <button class="btn" (click)="loadReservation()">Try Again</button>
      </div>

      <div class="content" *ngIf="!loading() && !error() && reservation()">
        <div class="card">
          <h2>📋 Reservation Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Reservation ID:</span>
              <span class="value">{{ reservation()?.reservation_id }}</span>
            </div>
            <div class="info-item">
              <span class="label">Status:</span>
              <span class="value status" [class]="reservation()?.status">
                {{ getStatusText(reservation()?.status) }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">Customer:</span>
              <span class="value">{{ reservation()?.customer_full_name || reservation()?.customer_name || 'Walk-in Customer' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Table:</span>
              <span class="value">Table {{ reservation()?.table_id }}</span>
            </div>
            <div class="info-item" *ngIf="tableData()?.capacity">
              <span class="label">Capacity:</span>
              <span class="value">{{ tableData()!.capacity }} seats</span>
            </div>
            <div class="info-item">
              <span class="label">Party Size:</span>
              <span class="value">{{ reservation()?.party_size }}</span>
            </div>
            <div class="info-item">
              <span class="label">Date:</span>
              <span class="value">{{ reservation()?.formatted_date || reservation()?.reservation_date }}</span>
            </div>
            <div class="info-item">
              <span class="label">Time:</span>
              <span class="value">{{ reservation()?.formatted_time || reservation()?.reservation_time }}</span>
            </div>
            <div class="info-item notes-item" *ngIf="reservation()?.notes">
              <span class="label">📝 Notes:</span>
              <div class="notes-content">{{ reservation()?.notes }}</div>
            </div>
          </div>
        </div>

        <div class="actions">
          <button class="btn btn-primary" 
                  (click)="editReservation()" 
                  [disabled]="reservation()?.status === 'completed'">
            Edit Reservation
          </button>
          <button class="btn btn-danger" (click)="confirmDelete()">Delete Reservation</button>
          <button class="btn btn-secondary" (click)="navigateToTable(reservation()?.table_id)">View Table</button>
          <button 
            class="btn btn-success" 
            *ngIf="canSeatCustomer()" 
            (click)="seatCustomer()"
          >
            🪑 Seat Customer
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" *ngIf="showDeleteModal()" (click)="closeDeleteModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>🗑️ Delete Reservation</h3>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete this reservation?</p>
          <div class="reservation-info" *ngIf="reservation()">
            <p><strong>Customer:</strong> {{ reservation()?.customer_name || 'Unknown' }}</p>
            <p><strong>Date:</strong> {{ reservation()?.reservation_date }}</p>
            <p><strong>Time:</strong> {{ reservation()?.reservation_time }}</p>
            <p><strong>Table:</strong> {{ reservation()?.table_id }}</p>
          </div>
          <p class="warning">⚠️ This action cannot be undone!</p>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" (click)="closeDeleteModal()">Cancel</button>
          <button class="btn-delete" (click)="proceedWithDelete()">Delete</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reservation-detail {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .back-btn {
      background: #f1f3f4;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s ease;

      .back-icon {
        width: 1.2rem;
        height: 1.2rem;
        color: #5f6368;
      }

      &:hover {
        background: #e8eaed;
        transform: translateX(-2px);

        .back-icon {
          color: #1a73e8;
        }
      }
    }

    h1 {
      margin: 0;
      color: #202124;
    }

    .loading, .error {
      text-align: center;
      padding: 4rem 2rem;
    }

    .spinner {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    .error-icon {
      font-size: 3rem;
      color: #ea4335;
      margin-bottom: 1rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .btn-primary {
      background: #1a73e8;
      color: white;

      &:disabled {
        background: #9ca3af;
        color: #6b7280;
        cursor: not-allowed;
        opacity: 0.6;
      }
    }

    .btn-secondary {
      background: #f1f3f4;
      color: #3c4043;
    }

    .card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }

    h2 {
      margin: 0 0 1.5rem 0;
      color: #202124;
      font-size: 1.4rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .label {
      font-weight: 600;
      color: #5f6368;
      font-size: 0.9rem;
    }

    .value {
      font-weight: 500;
      color: #202124;
    }

    .notes-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .notes-content {
      background: #ffffff;
      border: 1px solid #e8eaed;
      border-radius: 8px;
      padding: 1rem;
      font-size: 0.9rem;
      line-height: 1.5;
      color: #202124;
      width: 100%;
      box-sizing: border-box;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .status {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status.confirmed { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
    .status.completed { background: rgba(52, 168, 83, 0.1); color: #34a853; }
    .status.completed { background: rgba(26, 115, 232, 0.1); color: #1a73e8; }
    .status.overdue { background: rgba(245, 158, 11, 0.15); color: #f59e0b; font-weight: 700; }

    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    @media (max-width: 768px) {
      .reservation-detail {
        padding: 1rem;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .actions {
        flex-direction: column;
      }

      .btn {
        width: 100%;
      }
    }

    //Modal Styles 
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      animation: modalSlideIn 0.3s ease-out;
    }

    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .modal-header {
      padding: 1.5rem 1.5rem 1rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h3 {
      margin: 0;
      color: #dc2626;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-body p {
      margin: 0 0 1rem;
      color: #374151;
      line-height: 1.5;
    }

    .reservation-info {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
    }

    .reservation-info p {
      margin: 0.5rem 0;
      font-size: 0.9rem;
    }

    .reservation-info strong {
      color: #374151;
      font-weight: 600;
    }

    .warning {
      color: #dc2626 !important;
      font-weight: 600;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      padding: 0.75rem;
      margin: 1rem 0 0 !important;
    }

    .modal-footer {
      padding: 1rem 1.5rem 1.5rem;
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }

    .btn-cancel, .btn-delete {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      font-size: 0.9rem;
    }

    .btn-cancel {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-cancel:hover {
      background: #e5e7eb;
      border-color: #9ca3af;
    }

    .btn-delete {
      background: #dc2626;
      color: white;
    }

    .btn-delete:hover {
      background: #b91c1c;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
    }

    .btn-delete:active {
      transform: translateY(0);
    }
  `]
})
export class ReservationDetailComponent implements OnInit {
  // Reactive state using Angular signals
  reservation = signal<Reservation | null>(null);
  customer = signal<any | null>(null);
  tableData = signal<Table | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  showDeleteModal = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservationService: ReservationService,
    private customerService: CustomerService,
    private restaurantApi: RestaurantApiService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadReservation();
  }

  async loadReservation() {
    const reservationId = this.route.snapshot.paramMap.get('reservationId');

    if (!reservationId) {
      this.error.set('Reservation ID not found');
      this.loading.set(false);
      return;
    }

    try {
      this.loading.set(true);
      this.error.set(null);

      // Load reservation details
      const reservationRes = await firstValueFrom(
        this.reservationService.getReservationById(Number(reservationId))
      );


      if (reservationRes?.success && reservationRes?.data) {
        
        // Check if reservation should be overdue
        const reservation = reservationRes.data as Reservation;
        if (reservation.status === 'confirmed') {
          const isOverdue = this.checkIfOverdue(reservation);
          if (isOverdue) {
            reservation.status = 'overdue';
          }
        }
        
        this.reservation.set(reservation);

        // Load customer details if customer_id exists
        if (this.reservation()?.customer_id) {
          await this.loadCustomer(this.reservation()!.customer_id!);
        }

        // Load table details
        await this.loadTable(this.reservation()!.table_id!);
      } else {
        this.error.set('Reservation not found');
      }
    } catch (error) {
      this.error.set('Failed to load reservation details');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadCustomer(customerId: number) {
    try {
      const customerRes = await firstValueFrom(
        this.customerService.getCustomerById(customerId)
      );

      if (customerRes?.success && customerRes?.data) {
        this.customer.set(customerRes.data);
      }
    } catch (error) {
      // Customer load error is not critical
    }
  }

  private async loadTable(tableId: string) {
    try {
      const tablesRes = await firstValueFrom(
        this.restaurantApi.getTables()
      );

      if (tablesRes?.success && tablesRes?.data) {
        const table = tablesRes.data.find(t => t.table_id === tableId);
        if (table) {
          this.tableData.set(table);
        }
      }
    } catch (error) {
      // Table load error is not critical
    }
  }

  // Navigation methods
  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  navigateToTable(tableId: string) {
    if (tableId) {
      this.router.navigate(['/table', tableId]);
    }
  }

  editReservation() {
    if (this.reservation()) {
      this.router.navigate(['/reservations/edit', this.reservation()!.reservation_id]);
    }
  }

  confirmDelete() {
    if (!this.reservation()) return;
    
    // Show modal instead of browser alert
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
  }

  async proceedWithDelete() {
    if (!this.reservation()) return;
    
    const reservation = this.reservation()!;
    
    try {
      // 1. Delete the reservation
      const response = await firstValueFrom(
        this.reservationService.deleteReservation(reservation.reservation_id)
      );

      if (response?.success) {
        
        // 2. Update table status to available and clear customer data
        try {
          await firstValueFrom(
            this.restaurantApi.updateTableStatus(reservation.table_id, {
              is_occupied: false,
              is_reserved: false,
              table_status: 'available'
            })
          );
          
          // Clear customer data from table
          await firstValueFrom(
            this.restaurantApi.clearTableCustomer(reservation.table_id)
          );
        } catch (tableError) {
          // Don't fail the whole operation if table update fails
        }

        this.toastService.success('Reservation Deleted', 'The reservation has been successfully deleted and table made available');
        this.showDeleteModal.set(false);
        
        // Navigate to dashboard and force refresh
        this.router.navigate(['/dashboard'], { queryParams: { refresh: Date.now() } });
      } else {
        this.toastService.error('Delete Failed', 'Failed to delete the reservation');
      }
    } catch (err) {
      this.toastService.error('Delete Failed', 'An error occurred while deleting the reservation');
    }
  }

  viewCustomer(customerId?: number) {
    if (customerId) {
      this.toastService.info('Customer details coming soon!', 'This feature is under development.');
    }
  }

  // Status management
  async updateReservationStatus(newStatus: string) {
    if (!this.reservation() || !newStatus) return;

    const currentStatus = this.reservation()?.status;
    if (currentStatus === newStatus) return;

    const confirmMessage = `Are you sure you want to change the reservation status from "${this.getStatusText(currentStatus)}" to "${this.getStatusText(newStatus)}"?`;

    if (!confirm(confirmMessage)) return;

    try {
      const response = await firstValueFrom(
        this.reservationService.updateReservation(this.reservation()!.reservation_id, { status: newStatus as Reservation['status'] })
      );

      if (response?.success) {
        // Update local state
        this.reservation.update(res => res ? { ...res, status: newStatus as Reservation['status'] } : null);
        this.toastService.success('Status Updated', `Reservation status changed to ${this.getStatusText(newStatus)}`);
      } else {
        this.toastService.error('Update Failed', 'Failed to update reservation status');
      }
    } catch (err) {
      this.toastService.error('Delete Failed', 'An error occurred while deleting the reservation');
    }
  }



  // Utility methods
  getStatusIcon(status?: string): string {
    switch (status) {
      case 'confirmed': return '✅';
      case 'completed': return '✅';
      case 'seated': return '👥';
      case 'overdue': return '⏰';
      default: return '📅';
    }
  }

  getStatusText(status?: string): string {
    if (!status) return 'Unknown';
    const statusMap: { [key: string]: string } = {
      'confirmed': 'Confirmed',
      'completed': 'Seated',
      'overdue': 'Overdue'
    };
    return statusMap[status] || status;
  }

  getNextStatus(currentStatus?: string): string {
    switch (currentStatus) {
      case 'pending': return 'confirmed';
      case 'confirmed': return 'completed';
      case 'completed': return 'confirmed';
      case 'cancelled': return 'pending';
      default: return 'confirmed';
    }
  }

  getStatusActionText(currentStatus?: string): string {
    switch (currentStatus) {
      case 'pending': return 'Confirm';
      case 'confirmed': return 'Seat Guest';
      case 'completed': return 'Reopen';
      case 'cancelled': return 'Reactivate';
      default: return 'Update Status';
    }
  }

  getStatusActionIcon(currentStatus?: string): string {
    switch (currentStatus) {
      case 'pending': return '✅';
      case 'confirmed': return '👥';
      case 'completed': return '🔄';
      case 'cancelled': return '🔄';
      default: return '📝';
    }
  }

  getStatusActionClass(currentStatus?: string): string {
    switch (currentStatus) {
      case 'pending': return 'confirm';
      case 'confirmed': return 'seat';
      case 'completed': return 'reopen';
      case 'cancelled': return 'reactivate';
      default: return 'update';
    }
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'Not specified';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  // Check if reservation is overdue
  checkIfOverdue(reservation: Reservation): boolean {
    const now = new Date();
    
    // Try different date formats from backend
    let reservationTime: Date;
    if (reservation.reservation_date && reservation.reservation_time) {
      reservationTime = new Date(`${reservation.reservation_date}T${reservation.reservation_time}`);
    } else if ((reservation as any).formatted_date && (reservation as any).formatted_time) {
      // Try formatted date (DD/MM/YYYY) and time (HH:MM)
      const [day, month, year] = (reservation as any).formatted_date.split('/');
      const [hour, minute] = (reservation as any).formatted_time.split(':');
      reservationTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
    } else {
      return false;
    }
    
    const timeDiff = reservationTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    
    // Reservation is overdue if it's more than 1 second past the reservation time
    return minutesDiff < 0;
  }

  // Check if customer can be seated
  canSeatCustomer(): boolean {
    const res = this.reservation();
    if (!res) return false;


    // Can seat if status is overdue or confirmed and time is within 15 minutes
    if (res.status === 'overdue') {
      return true;
    }
    
    if (res.status === 'confirmed') {
      const now = new Date();
      
      // Try different date formats from backend
      let reservationTime: Date;
      if (res.reservation_date && res.reservation_time) {
        reservationTime = new Date(`${res.reservation_date}T${res.reservation_time}`);
      } else if ((res as any).formatted_date && (res as any).formatted_time) {
        // Try formatted date (DD/MM/YYYY) and time (HH:MM)
        const [day, month, year] = (res as any).formatted_date.split('/');
        const [hour, minute] = (res as any).formatted_time.split(':');
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
  async seatCustomer() {
    const res = this.reservation();
    if (!res) return;


    try {
      // 1. Call backend to seat customer
      const seatResponse = await firstValueFrom(
        this.restaurantApi.seatCustomer(res.table_id, res.customer_id)
      );

      if (!seatResponse?.success) {
        this.toastService.error('Seating Failed', 'Failed to seat the customer');
        return;
      }

      // 2. Create order for the seated customer

      const orderResponse = await firstValueFrom(
        this.restaurantApi.createOrder(res.table_id, res.customer_id)
      );

      if (orderResponse?.success) {
        this.toastService.success('Customer Seated!', `Customer seated and order #${orderResponse.data.order_id} created`);
        
        // Update reservation status to completed
        this.reservation.update(r => r ? { ...r, status: 'completed' } : null);
        
        // Navigate to table view
        this.navigateToTable(res.table_id);
      } else {
        this.toastService.error('Order Creation Failed', 'Customer seated but failed to create order');
        
        // Still update reservation status and navigate
        this.reservation.update(r => r ? { ...r, status: 'completed' } : null);
        this.navigateToTable(res.table_id);
      }

    } catch (error) {
      this.toastService.error('Seating Failed', 'An error occurred while seating the customer');
    }
  }
}