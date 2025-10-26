import { Component, signal, computed, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestaurantApiService } from '../../../../../core/services/restaurant-api.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { Router } from '@angular/router';
import { ReservationService } from '../../../../../core/services/reservation.service';
import { ConfirmationModalComponent, ConfirmationModalData } from '../../../../../shared/components/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-table-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmationModalComponent],
  template: `
    <div class="table-management-container">
      <!-- Header Section -->
      <div class="section-header">
        <div class="header-content">
          <h2>Table Management</h2>
          <p>Manage restaurant tables and their assignments</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="toggleAddTableForm()">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path *ngIf="!showAddTableForm()" d="M12 5v14"/>
              <path *ngIf="!showAddTableForm()" d="M5 12h14"/>
              <path *ngIf="showAddTableForm()" d="M18 6L6 18"/>
              <path *ngIf="showAddTableForm()" d="M6 6l12 12"/>
            </svg>
            {{ showAddTableForm() ? 'Cancel' : 'Add New Table' }}
          </button>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="filters-section">
        <div class="filter-group">
          <label for="sectionFilter">Filter by Section:</label>
          <select 
            id="sectionFilter"
            [(ngModel)]="selectedSection"
            (change)="onSectionFilterChange()"
            class="filter-select"
          >
            <option value="">All Sections</option>
            <option *ngFor="let section of sections()" [value]="section">
              Section {{ section }}
            </option>
          </select>
        </div>
        <div class="filter-stats">
          <span class="stat-item">
            <strong>{{ getFilteredTables().length }}</strong> tables
          </span>
          <span class="stat-item" *ngIf="selectedSection()">
            in Section {{ selectedSection() }}
          </span>
        </div>
      </div>

    <!-- Add Table Form -->
    <div class="form-section" *ngIf="showAddTableForm()">
      <h3>Add New Table</h3>
      <form (ngSubmit)="createTable()" #tableForm="ngForm">
        <div class="form-grid">
          <div class="form-group">
            <label for="section">Section *</label>
            <select 
              id="section"
              name="section"
              [(ngModel)]="newTable.section"
              (change)="onSectionChange()"
              required
              #section="ngModel"
            >
              <option value="">Select Section</option>
              <option *ngFor="let sec of getAvailableSections()" [value]="sec">{{ sec }}</option>
              <option *ngIf="canCreateNewSection()" value="create-new">+ Create New Section</option>
            </select>
            <div class="error-message" *ngIf="section.invalid && section.touched">
              Section is required
            </div>
          </div>

          <div class="form-group">
            <label for="tableId">Table ID *</label>
            <input 
              id="tableId"
              type="text" 
              [(ngModel)]="newTable.table_id"
              name="table_id"
              placeholder="Auto-generated"
              readonly
              #tableId="ngModel"
            />
            <small class="form-help">Table ID will be automatically generated based on section selection</small>
            <div class="error-message" *ngIf="!newTable.table_id && tableForm.submitted">
              Table ID is required. Please select a section first.
            </div>
          </div>

          <div class="form-group">
            <label for="capacity">Capacity *</label>
            <input 
              id="capacity"
              type="number" 
              [(ngModel)]="newTable.capacity"
              name="capacity"
              placeholder="1-20"
              required
              min="1"
              max="20"
              #capacity="ngModel"
            />
            <div class="error-message" *ngIf="capacity.invalid && capacity.touched">
              <span *ngIf="capacity.errors?.['required']">Capacity is required</span>
              <span *ngIf="capacity.errors?.['min'] || capacity.errors?.['max']">Capacity must be between 1-20</span>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button 
            type="submit" 
            class="btn-success"
            [disabled]="!isFormValid() || isCreatingTable()"
          >
            {{ isCreatingTable() ? 'Creating...' : 'Create Table' }}
          </button>
          <button 
            type="button" 
            class="btn-cancel"
            (click)="resetTableForm()"
          >
            Reset Form
          </button>
        </div>
      </form>
    </div>

    <!-- Edit Table Form -->
    <div class="form-section" *ngIf="showEditTableForm()">
             <h3>Edit Table: {{ editingTable()?.table_id }}</h3>
      <form (ngSubmit)="updateTable()" #editTableForm="ngForm">
        <div class="form-grid">
          <div class="form-group">
            <label for="editCapacity">Capacity *</label>
            <input 
              id="editCapacity"
              type="number" 
              [(ngModel)]="editingTable().capacity"
              name="editCapacity"
              placeholder="1-20"
              required
              min="1"
              max="20"
              #editCapacity="ngModel"
            />
            <div class="error-message" *ngIf="editCapacity.invalid && editCapacity.touched">
              <span *ngIf="editCapacity.errors?.['required']">Capacity is required</span>
              <span *ngIf="editCapacity.errors?.['min'] || editCapacity.errors?.['max']">Capacity must be between 1-20</span>
            </div>
          </div>

        </div>

        <div class="form-actions">
          <button 
            type="submit" 
            class="btn-success"
            [disabled]="!isEditFormValid() || isUpdatingTable()"
          >
            {{ isUpdatingTable() ? 'Updating...' : 'Update Table' }}
          </button>
          <button 
            type="button" 
            class="btn-cancel"
            (click)="cancelEdit()"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>

      <!-- Tables Grid -->
      <div class="tables-grid" *ngIf="!loadingTables()">
        <div *ngIf="getFilteredTables().length === 0" class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="12" rx="2"/>
              <path d="M3 9h18"/>
              <path d="M3 15h18"/>
              <path d="M9 3v18"/>
              <path d="M15 3v18"/>
            </svg>
          </div>
          <h3>No Tables Found</h3>
          <p *ngIf="selectedSection()">No tables found in Section {{ selectedSection() }}</p>
          <p *ngIf="!selectedSection()">No tables have been created yet</p>
          <button class="btn-primary" (click)="toggleAddTableForm()">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14"/>
              <path d="M5 12h14"/>
            </svg>
            Add First Table
          </button>
        </div>

        <div *ngIf="getFilteredTables().length > 0" class="tables-container">
          <!-- Dynamic Sections -->
          <ng-container *ngFor="let section of getAvailableSections()">
            <div *ngIf="selectedSection() === '' || selectedSection() === section" class="section-group">
              <h3 class="section-title">Section {{ section }}</h3>
              <div class="section-tables">
                <div *ngFor="let table of getTablesBySection(section)" class="table-card" [class]="getTableStatusClass(table)">
                  <div class="table-header">
                    <div class="table-title">
                      <h4>{{ table.table_id }}</h4>
                    </div>
                    <div class="status-badge" [class]="getTableStatusClass(table)">
                      {{ getTableStatusText(table) }}
                    </div>
                  </div>
                  
                  <div class="table-details">
                    <div class="detail-item">
                      <span class="detail-label">Capacity:</span>
                      <span class="detail-value">{{ table.capacity }} people</span>
                    </div>
                    
                    <!-- Today's Reservation Info -->
                    <div *ngIf="hasReservationToday(table)" class="detail-item reservation-info">
                      <span class="detail-label">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <path d="M16 2v4"/>
                          <path d="M8 2v4"/>
                          <path d="M3 10h18"/>
                        </svg>
                        Reserved Today:
                      </span>
                      <span class="detail-value">{{ getReservationTime(table) }}</span>
                    </div>
                  </div>
                  
                  <div class="table-actions">
                    <button class="btn-edit" (click)="editTable(table)">
                      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Edit
                    </button>
                    <button 
                      *ngIf="canDeleteTable(table)"
                      class="btn-danger" 
                      (click)="showDeleteConfirmation(table)"
                      [title]="getDeleteButtonTitle(table)"
                    >
                      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </ng-container>

        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loadingTables()" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading tables...</p>
      </div>

      <!-- Delete Confirmation Modal -->
      <app-confirmation-modal
        [data]="deleteModalData()"
        (confirm)="confirmDeleteTable()"
        (cancel)="cancelDeleteTable()"
        #deleteModal
      ></app-confirmation-modal>
  `,
  styleUrls: ['./table-management.component.scss']
})
export class TableManagementComponent implements OnInit {
  @ViewChild('deleteModal') deleteModal: any;
  
  // State signals
  showAddTableForm = signal(false);
  showEditTableForm = signal(false);
  isCreatingTable = signal(false);
  isUpdatingTable = signal(false);
  loadingTables = signal(false);
  tables = signal<any[]>([]);
  tableToDelete = signal<any>(null);
  deleteModalData = signal<any>({
    title: 'Delete Table',
    message: 'Are you sure you want to delete this table?',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger'
  });
  editingTable = signal<any>(null);
  selectedSection = signal<string>('');
  sections = signal<string[]>(['A', 'B', 'C', 'D', 'E', 'F']); // Available sections


  // Form data
  newTable = {
    section: '',
    table_id: '',
    capacity: null
  };

  constructor(
    private restaurantApi: RestaurantApiService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
    private router: Router,
    private reservationService: ReservationService
  ) {}

  ngOnInit(): void {
    this.loadTables();
  }

  async loadTables(): Promise<void> {
    this.loadingTables.set(true);
    try {
      const response: any = await this.restaurantApi.getTables().toPromise();

      this.tables.set(response.data || []);
      
      // Load sections dynamically from existing tables
      this.loadSectionsFromTables();
    } catch (error) {
  
      this.toastService.error('Error! ❌', 'Failed to load tables. Please try again.');
      this.tables.set([]);
    } finally {
      this.loadingTables.set(false);
    }
  }

  loadSectionsFromTables(): void {
    const existingSections = new Set<string>();
    
    // Get all unique sections from existing tables
    this.tables().forEach(table => {
      let section = '';
      
      // Try section_code first, then extract from table_id
      if (table.section_code) {
        section = table.section_code;
      } else if (table.table_id) {
        // Extract section from table_id (e.g., "A-01" -> "A")
        const match = table.table_id.match(/^([A-Z])-/);
        if (match) {
          section = match[1];
        }
      }
      
      if (section) {
        existingSections.add(section);
      }
    });
    
    // Convert to sorted array
    const sortedSections = Array.from(existingSections).sort();
    
    // If no sections found, keep default sections
    if (sortedSections.length === 0) {
      this.sections.set(['A', 'B', 'C', 'D', 'E', 'F']);
    } else {
      this.sections.set(sortedSections);
    }
    

  }

  // Helper methods
  getTableStatusClass(table: any): string {
    // Check table_status from dashboard_tables view first
    if (table.table_status === 'reserved') return 'reserved';
    if (table.is_reserved) return 'reserved';
    if (table.is_occupied) return 'occupied';
    return 'available';
  }

  getTableStatusText(table: any): string {
    // Check if table has today's reservation (from dashboard_tables view)
    if (table.table_status === 'reserved') return 'Reserved Today';
    if (table.is_reserved) return 'Reserved';
    if (table.is_occupied) return 'Occupied';
    return 'Available';
  }
  
  hasReservationToday(table: any): boolean {
    // Check if table has reservation info from dashboard_tables view
    return table.reservation_id && table.reservation_date && table.reservation_time;
  }
  
  getReservationTime(table: any): string {
    if (!this.hasReservationToday(table)) return '';
    
    // Format time (HH:MM:SS -> HH:MM)
    const time = table.reservation_time;
    if (time && time.includes(':')) {
      const parts = time.split(':');
      return `${parts[0]}:${parts[1]}`;
    }
    return time || '';
  }


  isHighestIdInSection(table: any): boolean {
    // Extract section from table_id (e.g., "A-01" -> section: "A")
    const tableMatch = table.table_id.match(/^([A-Z])-(\d+)$/);
    if (!tableMatch) return false;
    
    const tableSection = tableMatch[1];
    const tableNumber = parseInt(tableMatch[2]);
    
    // Get all tables in the same section
    const sectionTables = this.tables().filter(t => {
      const match = t.table_id.match(/^([A-Z])-(\d+)$/);
      return match && match[1] === tableSection;
    });
    
    if (sectionTables.length === 0) return false;
    
    // Find the highest number in this section
    const maxNumber = Math.max(...sectionTables.map(t => {
      const match = t.table_id.match(/^([A-Z])-(\d+)$/);
      return match ? parseInt(match[2]) : 0;
    }));
    
    // Return true if this table has the highest number in its section
    return tableNumber === maxNumber;
  }


  getAvailableSections(): string[] {
    return this.sections();
  }

  canCreateNewSection(): boolean {
    // Check if we can create a new section (max 26 sections: A-Z)
    return this.sections().length < 26;
  }

  getTablesBySection(section: string): any[] {
    return this.getFilteredTables().filter(table => 
      table.table_id && table.table_id.startsWith(section + '-')
    );
  }

  checkAndRemoveEmptySection(section: string): void {
    // Check if there are any tables left in this section
    const tablesInSection = this.tables().filter(table => 
      table.table_id && table.table_id.startsWith(section + '-')
    );

    // If no tables left in section, check if it's safe to remove
    if (tablesInSection.length === 0) {
      const currentSections = this.sections();
      const sectionIndex = currentSections.indexOf(section);
      
      if (sectionIndex > -1) {
        // Check if this is the last section (highest letter)
        const isLastSection = this.isLastSection(section);
        
        if (isLastSection) {
          // Only remove if it's the last section
          const updatedSections = [...currentSections];
          updatedSections.splice(sectionIndex, 1);
          this.sections.set(updatedSections);
          this.toastService.info('Section Removed', `Section ${section} has been removed as it has no tables`);
        } else {
          // Don't remove section if there are sections after it
          this.toastService.info('Section Preserved', `Section ${section} is preserved because there are sections after it (${this.getSectionsAfter(section).join(', ')}). Remove tables from later sections first.`);
        }
        
        // Force change detection
        this.cdr.detectChanges();
      }
    }
  }

  isLastSection(section: string): boolean {
    const currentSections = this.sections();
    const sectionIndex = currentSections.indexOf(section);
    
    // If section not found or it's the last one in the array
    return sectionIndex === currentSections.length - 1;
  }

  getSectionsAfter(section: string): string[] {
    const currentSections = this.sections();
    const sectionIndex = currentSections.indexOf(section);
    
    if (sectionIndex === -1 || sectionIndex === currentSections.length - 1) {
      return [];
    }
    
    return currentSections.slice(sectionIndex + 1);
  }

  isFormValid(): boolean {
    return !!(
      this.newTable.section &&
      this.newTable.table_id &&
      this.newTable.capacity &&
      this.newTable.capacity >= 1 &&
      this.newTable.capacity <= 20
    );
  }


  // UI methods
  toggleAddTableForm(): void {
    this.showAddTableForm.set(!this.showAddTableForm());
    
    // No need to check showTableList as it's been removed
    
    if (!this.showAddTableForm()) {
      this.resetTableForm();
    }
  }

  // Filter methods
  onSectionFilterChange(): void {
    const section = this.selectedSection();
    
    // Filter is handled by getFilteredTables() method
    // Force change detection
    this.cdr.detectChanges();
  }

  createNewSection(): void {
    const currentSections = this.sections();
    
    // Find the first missing letter (A-Z)
    const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const availableLetters = allLetters.filter(letter => !currentSections.includes(letter));
    
    if (availableLetters.length === 0) {
      this.toastService.error('Maximum Sections Reached! ❌', 'Cannot create more sections. Maximum limit is Z (26 sections).');
      return;
    }
    
    const nextSection = availableLetters[0]; // First missing letter
    
    // Add new section to sections array
    const updatedSections = [...currentSections, nextSection].sort();
    this.sections.set(updatedSections);
    
    // Select the new section in the form
    this.newTable.section = nextSection;
    
    // Generate table ID for the new section
    this.generateNextTableId();
    
    // Show success message
    this.toastService.success('Success', `Section ${nextSection} created successfully`);
    
    // Force change detection
    this.cdr.detectChanges();
  }

  getFilteredTables(): any[] {
    const allTables = this.tables();
    const section = this.selectedSection();

    if (!section) {
      return allTables;
    }
    
    // Extract section from table_id (e.g., "A-01" -> "A")
    return allTables.filter(table => {
      const tableSection = table.table_id ? table.table_id.split('-')[0] : '';
      return tableSection === section;
    });
  }

  // Data methods
  async refreshTableList(): Promise<void> {
    await this.loadTables();
  }


     // Section and Table ID Management
   async onSectionChange(): Promise<void> {
     if (this.newTable.section === 'create-new') {
       this.createNewSection();
     } else if (this.newTable.section) {
       // Reload tables to ensure we have latest data before generating ID
       await this.loadTables();
       this.generateNextTableId();
     } else {
       this.newTable.table_id = '';
     }
   }

     generateNextTableId(): void {
     if (!this.newTable.section) return;

     const sectionTables = this.tables().filter(table => 
       table.table_id.startsWith(this.newTable.section + '-')
     );

     if (sectionTables.length === 0) {
       this.newTable.table_id = `${this.newTable.section}-01`;
       return;
     }

     // Extract numbers and find the next available number
     const tableNumbers = sectionTables.map(table => {
       const match = table.table_id.match(new RegExp(`^${this.newTable.section}-(\\d+)$`));
       return match ? parseInt(match[1]) : 0;
     }).filter(num => num > 0);

     if (tableNumbers.length === 0) {
       this.newTable.table_id = `${this.newTable.section}-01`;
       return;
     }

     const maxNumber = Math.max(...tableNumbers);
     const nextNumber = maxNumber + 1;
     this.newTable.table_id = `${this.newTable.section}-${nextNumber.toString().padStart(2, '0')}`;
   }

  // Table actions


  // Form methods
  resetTableForm(): void {
    this.newTable = {
      section: '',
      table_id: '',
      capacity: null
    };
    this.isCreatingTable.set(false);
  }

     async createTable(): Promise<void> {
     this.isCreatingTable.set(true);

     
     // Validate form data before sending
     if (!this.newTable.table_id || !this.newTable.capacity) {
 
       this.toastService.error('Validation Failed! ❌', 'Please fill in all required fields.');
       this.isCreatingTable.set(false);
       return;
     }
     
     try {
       const tableData: any = {
         table_id: this.newTable.table_id,
         capacity: this.newTable.capacity || 1 // Default to 1 if null
       };

       
       const response = await this.restaurantApi.createTable(tableData).toPromise();

      this.toastService.success('Table Created!', `Table "${this.newTable.table_id}" has been successfully created!`);
      this.resetTableForm();
      this.showAddTableForm.set(false);
      
      // Reload tables from backend to ensure consistency
      await this.loadTables();
      
      // Tables are now always visible, no need to toggle
      
         } catch (error: any) {
  
       
       let errorMessage = 'Table creation failed. Please try again.';
      
      if (error?.status === 400) {

        if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error?.error?.errors && Array.isArray(error.error.errors)) {
          // Handle validation errors array
          const validationErrors = error.error.errors.map((err: any) => err.message || err).join(', ');
          errorMessage = `Validation errors: ${validationErrors}`;
        } else {
          errorMessage = 'Invalid data provided. Please check all fields and try again.';
        }
      } else if (error?.status === 409) {
        errorMessage = `Table ID "${this.newTable.table_id}" already exists. Please choose a different section.`;
      } else if (error?.status === 401) {
        errorMessage = 'Authentication required. Please login again.';
      } else if (error?.status === 403) {
        errorMessage = 'You don\'t have permission to create tables.';
      } else if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      this.toastService.error('Creation Failed! ❌', errorMessage);
    } finally {
      this.isCreatingTable.set(false);
    }
  }

  // Edit table methods
  editTable(table: any): void {
    this.editingTable.set(table);
    this.showEditTableForm.set(true);
    this.showAddTableForm.set(false);
  }

  cancelEdit(): void {
    this.editingTable.set(null);
    this.showEditTableForm.set(false);
  }

  isEditFormValid(): boolean {
    const table = this.editingTable();
    return !!(
      table &&
      table.capacity &&
      table.capacity >= 1 &&
      table.capacity <= 20
    );
  }

     async updateTable(): Promise<void> {
     this.isUpdatingTable.set(true);
     
     try {
       const table = this.editingTable();
       
       const updateData: any = {
         capacity: parseInt(table.capacity) || table.capacity // Ensure capacity is a number
       };

        
        const response = await this.restaurantApi.updateTable(table.table_id, updateData).toPromise();

             if (response?.data) {
         // Update the table in the local list with backend response data
         const updatedTables = this.tables().map(t => 
           t.table_id === table.table_id ? { ...t, ...response.data } : t
         );
         this.tables.set(updatedTables);
       } else {
         // Fallback: update with local data if backend doesn't return updated data
         const updatedTables = this.tables().map(t => 
           t.table_id === table.table_id ? { ...t, ...updateData } : t
         );
         this.tables.set(updatedTables);
       }
      
             this.toastService.success('Table Updated! ✅', `Table "${table.table_id}" has been successfully updated!`);
       this.cancelEdit();
       
       // Refresh table list from backend to ensure data consistency
       await this.refreshTableList();
       this.cdr.detectChanges(); // Force change detection
      
         } catch (error: any) {
       // Error handling for table update failure
       
       let errorMessage = 'Table update failed. Please try again.';
      
      if (error?.status === 400) {
        if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error?.error?.errors && Array.isArray(error.error.errors)) {
          // Handle validation errors array
          const validationErrors = error.error.errors.map((err: any) => err.message || err).join(', ');
          errorMessage = `Validation errors: ${validationErrors}`;
        } else {
          errorMessage = 'Invalid data provided. Please check all fields and try again.';
        }
      } else if (error?.status === 404) {
        errorMessage = 'Table not found. It may have been deleted.';
      } else if (error?.status === 401) {
        errorMessage = 'Authentication required. Please login again.';
      } else if (error?.status === 403) {
        errorMessage = 'You don\'t have permission to update tables.';
      } else if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      this.toastService.error('Update Failed! ❌', errorMessage);
    } finally {
      this.isUpdatingTable.set(false);
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  // Delete table methods
  canDeleteTable(table: any): boolean {
    // Check if table is occupied
    if (table.is_occupied) {
      return false;
    }
    
    // Only allow deletion of the last table in a section
    const section = table.table_id.split('-')[0];
    const tableNumber = parseInt(table.table_id.split('-')[1]);
    
    const sectionTables = this.tables().filter(t => t.table_id.startsWith(section + '-'));
    const maxTableNumber = Math.max(...sectionTables.map(t => parseInt(t.table_id.split('-')[1])));
    
    return tableNumber === maxTableNumber;
  }

  getDeleteButtonTitle(table: any): string {
    if (table.is_occupied) {
      return 'Cannot delete occupied table';
    }
    
    const section = table.table_id.split('-')[0];
    const tableNumber = parseInt(table.table_id.split('-')[1]);
    const sectionTables = this.tables().filter(t => t.table_id.startsWith(section + '-'));
    const maxTableNumber = Math.max(...sectionTables.map(t => parseInt(t.table_id.split('-')[1])));
    
    if (tableNumber !== maxTableNumber) {
      return 'Can only delete the last table in section';
    }
    
    return 'Delete table (will remove all related data)';
  }

  showDeleteConfirmation(table: any): void {
    this.tableToDelete.set(table);
    
    // Prepare modal data
    const modalData = {
      title: 'Delete Table',
      message: `Are you sure you want to delete table ${table.table_id}?<br><br>⚠️ WARNING: This will permanently remove:<br>• All past orders from this table<br>• All reservations for this table<br>• The table itself<br><br>This action cannot be undone and should only be done during setup phase!`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    };
    
    this.deleteModalData.set(modalData);
    this.deleteModal.show();
  }

  async confirmDeleteTable(): Promise<void> {
    const table = this.tableToDelete();
    if (!table) return;

    try {
      const response = await this.restaurantApi.deleteTable(table.table_id).toPromise();
      
      if (response?.success) {
        this.toastService.success('Table Deleted!', `Table "${table.table_id}" has been successfully deleted!`);
        
        // Reload tables from backend to ensure consistency
        await this.loadTables();
      }
    } catch (error: any) {
      let errorMessage = 'Table deletion failed. Please try again.';
      
      if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      this.toastService.error('Deletion Failed! ❌', errorMessage);
    } finally {
      this.tableToDelete.set(null);
      this.deleteModal.hide();
    }
  }

  cancelDeleteTable(): void {
    this.tableToDelete.set(null);
    this.deleteModal.hide();
  }

}
