import { Component, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, AsyncValidatorFn } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ReservationService } from '../../core/services/reservation.service';
import { CustomerService } from '../../core/services/customer.service';
import { RestaurantApiService } from '../../core/services/restaurant-api.service';
import { ToastService } from '../../core/services/toast.service';
import { CreateReservationRequest, CreateCustomerRequest, Customer, Table } from '../../shared/interfaces/restaurant.interface';

@Component({
  standalone: true,
  selector: 'app-create-reservation',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  styleUrl: './create-reservation.component.scss',
  template: `
    <div class="create-reservation-container">
      <div class="header">
        <button class="back-btn" (click)="goBack()">
          <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          <span>Back to Dashboard</span>
        </button>
        <h1>Create Reservation</h1>
      </div>

      <div class="content">
        <!-- Loading State -->
        <div class="loading-state" *ngIf="loading()">
          <div class="loading-spinner">
            <svg class="loading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
          </div>
          <p>Loading available tables...</p>
        </div>

        <!-- Error State -->
        <div class="error-state" *ngIf="error() && !loading()">
          <div class="error-icon">
            <svg class="error-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <p>{{ error() }}</p>
          <button class="retry-btn" (click)="loadData()">Try Again</button>
        </div>

        <!-- Form -->
        <form [formGroup]="reservationForm" (ngSubmit)="onSubmit()" *ngIf="!loading() && !error()">
          <div class="form-grid">
            <!-- Customer Section -->
            <div class="form-card">
              <div class="card-header">
                <h3>
                  <svg class="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  Customer
                </h3>
              </div>
              <div class="card-content">
                <!-- Existing Customer Search -->
                <div class="customer-search">
                  <div class="form-group">
                    <label for="customerSearch">Search Existing Customer</label>
                    <input
                      type="text"
                      id="customerSearch"
                      formControlName="customerSearch"
                      placeholder="Search by name or phone..."
                      (input)="searchCustomers()"
                      [class]="getFieldValidationClass('customerSearch')"
                    />
                    <div class="error-message" *ngIf="hasFieldError('customerSearch', 'required')">
                      {{ getFieldErrorMessage('customerSearch') }}
                    </div>
                    
                    <!-- Search Results -->
                    <div class="search-results" *ngIf="searchResults().length > 0">
                      <div 
                        class="customer-item" 
                        *ngFor="let customer of searchResults()"
                        (click)="selectCustomer(customer)"
                      >
                        <div class="customer-info">
                          <strong>{{ customer.name }}</strong>
                          <span>{{ customer.phone_number }}</span>
                          <small *ngIf="customer.email">{{ customer.email }}</small>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Selected Customer -->
                    <div class="selected-customer" *ngIf="selectedCustomer()">
                      <div class="customer-info">
                        <strong>
                          <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 6 9 17l-5-5"/>
                          </svg>
                          {{ selectedCustomer()?.name }}
                        </strong>
                        <span>{{ selectedCustomer()?.phone_number }}</span>
                        <small *ngIf="selectedCustomer()?.email">{{ selectedCustomer()?.email }}</small>
                      </div>
                      <button type="button" class="clear-btn" (click)="clearSelectedCustomer()">
                        <svg class="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="m18 6-12 12"/>
                          <path d="m6 6 12 12"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <!-- OR Divider -->
                  <div class="divider">
                    <span>OR</span>
                  </div>

                  <!-- New Customer Creation -->
                  <div class="new-customer" *ngIf="!selectedCustomer()">
                    <h4>
                      <svg class="add-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M5 12h14"/>
                        <path d="M12 5v14"/>
                      </svg>
                      Create New Customer
                    </h4>
                    <div class="form-row">
                      <div class="form-group">
                        <label for="name">Name *</label>
                        <input
                          type="text"
                          id="name"
                          formControlName="name"
                          placeholder="Customer name"
                          [class]="getFieldValidationClass('name')"
                        />
                                                 <div class="error-message" *ngIf="shouldShowFieldError('name')">
                           {{ getFieldErrorMessage('name') }}
                         </div>
                      </div>
                      <div class="form-group">
                        <label for="phone_number">Phone *</label>
                        <input
                          type="tel"
                          id="phone_number"
                          formControlName="phone_number"
                          placeholder="Phone number"
                          [class]="getFieldValidationClass('phone_number')"
                        />
                        <div class="error-message" *ngIf="shouldShowFieldError('phone_number')">
                          {{ getFieldErrorMessage('phone_number') }}
                        </div>
                      </div>
                    </div>
                    <div class="form-group">
                      <label for="email">Email</label>
                      <input 
                        type="email" 
                        id="email"
                        formControlName="email" 
                        placeholder="Email (optional)"
                      />
                    </div>
                    <div class="form-group">
                      <label for="address">Address</label>
                      <textarea 
                        id="address"
                        formControlName="address" 
                        placeholder="Address (optional)"
                        rows="2"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Reservation Section -->
            <div class="form-card">
              <div class="card-header">
                <h3>
                  <svg class="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Reservation
                </h3>
              </div>
              <div class="card-content">
                <div class="form-row">
                  <div class="form-group">
                    <label>Table *</label>
                    <div class="table-info-display" *ngIf="selectedTable()">
                      <div class="table-info-content">
                        <svg class="table-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M3 9h18v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/>
                          <path d="M3 9l3-3h12l3 3"/>
                          <path d="M9 9v6"/>
                          <path d="M15 9v6"/>
                        </svg>
                        <span class="table-text">Table {{ selectedTable()?.table_id }} (Capacity: {{ selectedTable()?.capacity }})</span>
                      </div>
                    </div>
                    <div class="error-message" *ngIf="!selectedTable()">
                      No table selected. Please go back to dashboard and select a table first.
                    </div>
                  </div>
                  <div class="form-group">
                    <label for="partySize">Party Size *</label>
                    <input
                      type="number"
                      id="partySize"
                      formControlName="partySize"
                      min="1"
                      [max]="selectedTable()?.capacity || 20"
                      placeholder="People"
                      [class]="getFieldValidationClass('partySize')"
                    />
                    <div class="error-message" *ngIf="getFieldErrorMessage('partySize')">
                      {{ getFieldErrorMessage('partySize') }}
                    </div>
                    <div class="help-text" *ngIf="selectedTable()" style="color: #6c757d; font-size: 0.75rem; font-weight: 500; margin-top: 0.25rem;">
                      Max capacity: {{ selectedTable()?.capacity }} people
                    </div>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="reservationDate">Date *</label>
                    <input 
                      type="date" 
                      id="reservationDate" 
                      formControlName="reservationDate"
                      [min]="today"
                      (change)="onDateChange()">
                  </div>
                                     <div class="form-group">
                     <label for="reservationTime">Time *</label>
                     <div class="time-selector">
                       <input 
                         type="text" 
                         id="reservationTime" 
                         formControlName="reservationTime" 
                         placeholder="Select time"
                         readonly
                         (click)="toggleTimeDropdown()"
                         [class]="getFieldValidationClass('reservationTime')"
                       />
                       <div class="time-dropdown" [class.show]="showTimeDropdown()">
                         <div class="time-options">
                           <div 
                             class="time-option" 
                             *ngFor="let time of availableTimes()"
                             (click)="selectTime(time)"
                             [class.selected]="reservationForm.get('reservationTime')?.value === time"
                           >
                             {{ time }}
                           </div>
                         </div>
                       </div>
                     </div>
                     <div class="error-message" *ngIf="getFieldErrorMessage('reservationTime')">
                       {{ getFieldErrorMessage('reservationTime') }}
                     </div>
                   </div>
                </div>

                <!-- Notes Section -->
                <div class="form-group">
                  <label for="notes">Notes (Optional)</label>
                  <textarea 
                    id="notes"
                    formControlName="notes" 
                    placeholder="Any special requests or notes..."
                    rows="3"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="form-actions">
            <button 
              type="button" 
              class="btn btn-secondary" 
              (click)="goBack()">
              Back to Dashboard
            </button>
            <button 
              type="submit" 
              class="btn btn-primary"
              [disabled]="reservationForm.invalid || submitting()">
              <span *ngIf="!submitting()">Create Reservation</span>
              <span *ngIf="submitting()">Creating...</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class CreateReservationComponent implements OnInit {
  reservationForm: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  submitting = signal(false);
  availableTables = signal<Table[]>([]);
  searchResults = signal<Customer[]>([]);
  selectedCustomer = signal<Customer | null>(null);
  selectedTable = signal<Table | null>(null);
  today = new Date().toISOString().split('T')[0];
  showTimeDropdown = signal(false);
  availableTimes = signal<string[]>([]);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private reservationService: ReservationService,
    private customerService: CustomerService,
    private restaurantApi: RestaurantApiService,
    private toastService: ToastService
  ) {
    this.reservationForm = this.fb.group({
      customerSearch: [''],
      partySize: ['', [Validators.required, Validators.min(1), Validators.max(20)]],
      reservationDate: ['', [Validators.required, this.futureDateValidator]],
      reservationTime: ['', [Validators.required, this.businessHoursValidator]],
      notes: ['', Validators.maxLength(500)],
      name: ['', [Validators.required, Validators.maxLength(100)], [this.nameExistsValidator]],
      phone_number: ['', [Validators.required, Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/), Validators.maxLength(20)]],
      email: ['', [Validators.email, Validators.maxLength(100)]],
      address: ['', Validators.maxLength(200)]
    });
  }

  ngOnInit() {
    this.loadData();
    this.generateAvailableTimes();
    
    // Check if tableId is provided in query params
    const tableId = this.route.snapshot.queryParams['tableId'];
    if (tableId) {
      // Wait for tables to load, then set the table
      setTimeout(() => {
        this.onTableChange({ target: { value: tableId } });
      }, 100);
    }
  }

  onTableChange(event: any) {
    const tableId = event.target.value;
    if (tableId) {
      const table = this.availableTables().find(t => t.table_id === tableId);
      this.selectedTable.set(table || null);
      
      // Update party size max validation based on table capacity
      if (table) {
        this.reservationForm.get('partySize')?.setValidators([
          Validators.required, 
          Validators.min(1), 
          Validators.max(table.capacity)
        ]);
        this.reservationForm.get('partySize')?.updateValueAndValidity();
        
        // If current party size exceeds table capacity, reset it
        const currentPartySize = this.reservationForm.get('partySize')?.value;
        if (currentPartySize && currentPartySize > table.capacity) {
          this.reservationForm.get('partySize')?.setValue(table.capacity);
        }
      }
    } else {
      this.selectedTable.set(null);
      // Reset to default max validation
      this.reservationForm.get('partySize')?.setValidators([
        Validators.required, 
        Validators.min(1), 
        Validators.max(20)
      ]);
      this.reservationForm.get('partySize')?.updateValueAndValidity();
    }
  }

  onDateChange() {
    // Re-validate time when date changes
    this.reservationForm.get('reservationTime')?.updateValueAndValidity();
  }

  async loadData() {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Load available tables
      const tablesResponse = await firstValueFrom(this.restaurantApi.getTables());
      if (tablesResponse?.success) {
        const availableTables = tablesResponse.data.filter(table => 
          !table.is_occupied && table.reservation_status !== 'confirmed'
        );
        this.availableTables.set(availableTables);
      }
    } catch (error) {
      this.error.set('Failed to load available tables. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async searchCustomers() {
    const searchTerm = this.reservationForm.get('customerSearch')?.value;
    if (!searchTerm || searchTerm.length < 2) {
      this.searchResults.set([]);
      return;
    }

    try {
      const response = await firstValueFrom(this.customerService.searchCustomers(searchTerm));
      if (response?.success) {
        this.searchResults.set(response.data);
      }
    } catch (error) {
      this.searchResults.set([]);
    }
  }

  // Check if customer name already exists
  async checkCustomerNameExists(name: string): Promise<boolean> {
    if (!name || name.trim().length < 2) return false;
    
    try {
      const response = await firstValueFrom(this.customerService.searchCustomers(name.trim()));
      if (response?.success && response.data.length > 0) {
        // Check if any customer has exact name match (case insensitive)
        return response.data.some(customer => 
          customer.name.toLowerCase().trim() === name.toLowerCase().trim()
        );
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  // Async validator for customer name uniqueness
  nameExistsValidator = (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value || control.value.trim().length < 2) {
      return of(null);
    }

    // Don't validate if a customer is already selected
    if (this.selectedCustomer()) {
      return of(null);
    }

    return this.customerService.searchCustomers(control.value.trim()).pipe(
      map(response => {
        if (response?.success && response.data.length > 0) {
          const nameExists = response.data.some(customer => 
            customer.name.toLowerCase().trim() === control.value.toLowerCase().trim()
          );
          return nameExists ? { nameExists: true } : null;
        }
        return null;
      }),
      catchError(() => of(null)) // Return null on error to avoid blocking form
    );
  }

  selectCustomer(customer: Customer) {
    this.selectedCustomer.set(customer);
    this.searchResults.set([]);
    this.reservationForm.get('customerSearch')?.setValue('');
    
    // Auto-populate name and phone fields
    this.reservationForm.patchValue({
      name: customer.name,
      phone_number: customer.phone_number,
      email: customer.email || '',
      address: customer.address || ''
    });
    
    // Remove required validation for name and phone since customer is selected
    this.reservationForm.get('name')?.setValidators([Validators.maxLength(100)]);
    this.reservationForm.get('name')?.setAsyncValidators([]);
    this.reservationForm.get('phone_number')?.setValidators([Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/), Validators.maxLength(20)]);
    this.reservationForm.get('name')?.updateValueAndValidity();
    this.reservationForm.get('phone_number')?.updateValueAndValidity();
  }

  clearSelectedCustomer() {
    this.selectedCustomer.set(null);
    
    // Clear the form fields when customer is deselected
    this.reservationForm.patchValue({
      name: '',
      phone_number: '',
      email: '',
      address: ''
    });
    
    // Re-apply validation to name and phone fields
    this.reservationForm.get('name')?.setValidators([Validators.required, Validators.maxLength(100)]);
    this.reservationForm.get('name')?.setAsyncValidators([this.nameExistsValidator]);
    this.reservationForm.get('phone_number')?.setValidators([Validators.required, Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/), Validators.maxLength(20)]);
    this.reservationForm.get('name')?.updateValueAndValidity();
    this.reservationForm.get('phone_number')?.updateValueAndValidity();
  }

  async onSubmit() {
    // Check if table is selected
    if (!this.selectedTable()) {
      this.toastService.error('Table Required', 'Please go back to dashboard and select a table first.');
      return;
    }

    if (this.reservationForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.submitting.set(true);

    try {
      const formValue = this.reservationForm.value;
      
      let customerId: number | undefined;

      // Check if customer is selected from search
      if (this.selectedCustomer()) {
        customerId = this.selectedCustomer()!.customer_id;
      } 
      // If no customer selected but new customer fields are filled
      else if (formValue.name && formValue.phone_number) {
        const customerData: CreateCustomerRequest = {
          name: formValue.name,
          phone_number: formValue.phone_number,
          email: formValue.email || undefined,
          address: formValue.address || undefined
        };

        const customerResponse = await firstValueFrom(this.customerService.createCustomer(customerData));
        if (customerResponse?.success) {
          customerId = customerResponse.data.customer_id;
        } else {
          throw new Error('Failed to create customer');
        }
      }
      
      // Fix date and time format
      const date = new Date(formValue.reservationDate);
      const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Format time as HH:MM:SS
      let formattedTime = formValue.reservationTime;
      if (formattedTime && !formattedTime.includes(':')) {
        // If only HH:MM format exists, add :00
        formattedTime = formattedTime + ':00';
      }

      const reservationData: CreateReservationRequest = {
        customer_id: customerId,
        table_id: this.selectedTable()?.table_id || '',
        party_size: Number(formValue.partySize), // Convert to Number
        reservation_date: formattedDate,
        reservation_time: formattedTime,
        notes: formValue.notes || undefined
      };
      const response = await firstValueFrom(this.reservationService.createReservation(reservationData));
      
      if (response?.success) {
        // Update table status to reserved
        const tableId = this.selectedTable()?.table_id;
        if (tableId) {
          try {
            await firstValueFrom(
              this.restaurantApi.updateTableStatus(tableId, {
                is_occupied: false,
                is_reserved: true,
                table_status: 'reserved'
              })
            );
          } catch (tableError) {
            console.warn('Failed to update table status:', tableError);
          }
        }

        this.toastService.success('Success', 'Reservation created successfully!');
        this.router.navigate(['/dashboard']);
      } else {
        throw new Error('Failed to create reservation');
      }
    } catch (error: any) {
      let errorMessage = 'Failed to create reservation';
      
      // Show detailed backend validation errors
      if (error.error?.errors && Array.isArray(error.error.errors)) {
        const validationErrors = error.error.errors.map((e: any) => e.message || e).join(', ');
        errorMessage = `Validation failed: ${validationErrors}`;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      this.toastService.error('Error', errorMessage);
    } finally {
      this.submitting.set(false);
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.reservationForm.controls).forEach(key => {
      const control = this.reservationForm.get(key);
      control?.markAsTouched();
    });
  }

  // Custom Validators
  futureDateValidator(control: any) {
    if (!control.value) return null;

    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return { pastDate: true };
    }

    // Check if date is not too far in the future (max 1 year)
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);

    if (selectedDate > maxDate) {
      return { tooFarFuture: true };
    }

    return null;
  }

  businessHoursValidator = (control: any) => {
    if (!control.value) return null;

    const time = control.value;
    const [hours, minutes] = time.split(':').map(Number);

    // Business hours: 11:00 - 23:00 (11 AM - 11:00 PM)
    const openHour = 11;
    const closeHour = 23;

    if (hours < openHour || hours > closeHour) {
      return { outsideBusinessHours: true };
    }

    // Allow only 10-minute intervals
    if (minutes % 10 !== 0) {
      return { invalidTimeInterval: true };
    }

    // Check if reservation is for today and time is in the past
    const selectedDate = this.reservationForm?.get('reservationDate')?.value;
    if (selectedDate) {
      const today = new Date().toISOString().split('T')[0];
      if (selectedDate === today) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // If reservation time is in the past (more than 10 minutes ago)
        if (hours < currentHour || (hours === currentHour && minutes < currentMinute - 10)) {
          return { pastTime: true };
        }
      }
    }

    return null;
  }

  // Check if field should show validation errors
  shouldShowFieldError(fieldName: string): boolean {
    const control = this.reservationForm.get(fieldName);
    if (!control || !control.errors || !control.touched) return false;
    
    // For name and phone, only show errors if no customer is selected
    if ((fieldName === 'name' || fieldName === 'phone_number') && this.selectedCustomer()) {
      return false;
    }
    
    return true;
  }

  // Validation error messages
  getFieldErrorMessage(fieldName: string): string {
    const control = this.reservationForm.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';

    const errors = control.errors;

    switch (fieldName) {
      case 'partySize':
        if (errors['required']) return 'Party size is required';
        if (errors['min']) return 'Party size must be at least 1';
        if (errors['max']) {
          const selectedTable = this.selectedTable();
          if (selectedTable) {
            return `Party size cannot exceed table capacity (${selectedTable.capacity})`;
          }
          return 'Party size cannot exceed 20';
        }
        break;

      case 'reservationDate':
        if (errors['required']) return 'Reservation date is required';
        if (errors['pastDate']) return 'Reservation date cannot be in the past';
        if (errors['tooFarFuture']) return 'Reservation date cannot be more than 1 year in the future';
        break;

             case 'reservationTime':
         if (errors['required']) return 'Reservation time is required';
         if (errors['outsideBusinessHours']) return 'Time must be between 11:00 AM and 11:00 PM';
         if (errors['invalidTimeInterval']) return 'Time must be in 10-minute intervals (e.g., 11:00, 11:10, 11:20)';
         if (errors['pastTime']) return 'Reservation time cannot be in the past for today';
         break;

             case 'phone_number':
         if (errors['required']) return 'Phone number is required';
         if (errors['pattern']) return 'Please enter a valid phone number';
         if (errors['maxlength']) return 'Phone number is too long';
         break;

      case 'email':
        if (errors['email']) return 'Please enter a valid email address';
        if (errors['maxlength']) return 'Email address is too long';
        break;

             case 'name':
         if (errors['required']) return 'Name is required';
         if (errors['maxlength']) return 'Name is too long';
         if (errors['nameExists']) return 'This name is already used by another customer. Please search for existing customer or use a different name.';
         break;

      case 'notes':
        if (errors['maxlength']) return 'Notes cannot exceed 500 characters';
        break;

      case 'address':
        if (errors['maxlength']) return 'Address is too long';
        break;
    }

    return 'This field is invalid';
  }

  // Check if field has specific error
  hasFieldError(fieldName: string, errorType: string): boolean {
    const control = this.reservationForm.get(fieldName);
    return control ? control.hasError(errorType) && control.touched : false;
  }

  // Get validation CSS classes
  getFieldValidationClass(fieldName: string): string {
    const control = this.reservationForm.get(fieldName);
    if (!control) return '';

    // For name and phone, only show validation classes if no customer is selected
    if ((fieldName === 'name' || fieldName === 'phone_number') && this.selectedCustomer()) {
      return '';
    }

    if (control.invalid && control.touched) {
      return 'invalid';
    }
    if (control.valid && control.touched && control.value) {
      return 'valid';
    }
    return '';
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  // Time dropdown methods
  generateAvailableTimes() {
    const times: string[] = [];
    for (let hour = 11; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 10) {
        // Skip times after 23:00 (11:00 PM)
        if (hour === 23 && minute > 0) {
          break;
        }
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    this.availableTimes.set(times);
  }

  toggleTimeDropdown() {
    this.showTimeDropdown.update(show => !show);
  }

  selectTime(time: string) {
    this.reservationForm.patchValue({ reservationTime: time });
    this.showTimeDropdown.set(false);
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.time-selector')) {
      this.showTimeDropdown.set(false);
    }
  }
}
