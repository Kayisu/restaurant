import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { RestaurantApiService } from '../../../../../core/services/restaurant-api.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { BillEditComponent } from './bill-edit.component';
import {
  Bill,
  BillProduct,
  CreateBillRequest,
  UpdateBillRequest,
} from '../../../../../shared/interfaces';

@Component({
  standalone: true,
  selector: 'app-billing-management',
  imports: [CommonModule, FormsModule, BillEditComponent],
  template: `
    <div class="billing-management-container">
      <!-- Header -->
      <div class="billing-header">
        <h1>
          <svg class="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10,9 9,9 8,9"/>
          </svg>
          Billing Management
        </h1>
        <div class="header-actions">

          <button class="btn btn-secondary" (click)="loadBills()">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="billing-filters">
        <div class="filter-row">
          <div class="filter-group">
            <div class="form-group">
              <label for="statusFilter">Payment Status</label>
              <select 
                id="statusFilter"
                [ngModel]="statusFilter()"
                (ngModelChange)="statusFilter.set($event); applyFilters()"
                class="form-select">
                <option value="">All Payment Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
         
            <div class="form-group search-group">
              <label for="searchType">Search Type</label>
              <select 
                id="searchType"
                [ngModel]="searchType()"
                (ngModelChange)="onSearchTypeChange($event)"
                class="form-select">
                <option value="">Select search type</option>
                <option value="bill_number">Bill Number</option>
                <option value="customer_name">Customer Name</option>
                <option value="customer_phone">Phone Number</option>
                <option value="table_id">Table ID</option>
              </select>
            </div>
            <div class="form-group">
              <label for="searchValue">Search Value</label>
              <input
                type="text"
                id="searchValue"
                [ngModel]="searchValue()"
                (ngModelChange)="searchValue.set($event); applyFilters()"
                [placeholder]="getSearchPlaceholder()"
                [disabled]="!searchType()"
                class="form-input">
            </div>
            <div class="form-group">
              <label for="dateFilter">Date Range</label>
              <input
                type="date"
                id="dateFilter"
                [ngModel]="dateFilter()"
                (ngModelChange)="dateFilter.set($event); applyFilters()"
                class="form-input">
            </div>
          </div>
          <div class="filter-actions">
            <button class="btn btn-secondary" (click)="clearFilters()">
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Bills Table -->
      <div class="bills-table-container">
        <div class="table-header">
          <div class="header-cell">Bill #</div>
          <div class="header-cell">Customer</div>
          <div class="header-cell">Table</div>
          <div class="header-cell">Amount</div>
          <div class="header-cell">Status</div>
          <div class="header-cell">Date</div>
          <div class="header-cell">Actions</div>
        </div>

        <div class="table-content">
          <!-- Loading State -->
          <div *ngIf="loading()" class="loading-state">
            <div class="loading-spinner">⏳</div>
            <p>Loading bills...</p>
          </div>

          <!-- Bills List -->
          <div *ngIf="!loading() && filteredBills().length > 0" class="bills-list">
            <div 
              *ngFor="let bill of filteredBills()" 
              class="bill-row"
              [class]="getBillStatusClass(bill.payment_status)">
              <div class="cell bill-number">{{ bill.bill_number }}</div>
              <div class="cell customer">
                <div class="customer-name">{{ bill.customer_name || 'Walk-in' }}</div>
                <div class="customer-phone" *ngIf="bill.customer_phone">{{ bill.customer_phone }}</div>
              </div>
              <div class="cell table">{{ bill.table_id || 'N/A' }}</div>
              <div class="cell amount">₺{{ formatPrice(bill.total_amount) }}</div>
              <div class="cell status">
                <span class="status-badge" [class]="getStatusClass(bill.payment_status)">
                  {{ getStatusText(bill.payment_status) }}
                </span>
              </div>
              <div class="cell date">{{ formatDate(bill.bill_date) }}</div>
              <div class="cell actions">
                <button class="btn btn-sm btn-primary" (click)="viewBill(bill)">
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  View
                </button>
                <button class="btn btn-sm btn-secondary" 
                        (click)="editBill(bill)" 
                        [disabled]="bill.payment_status === 'paid' || bill.payment_status === 'cancelled'">
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </button>
                <button class="btn btn-sm btn-danger" (click)="openDeleteModal(bill)">
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

          <!-- Empty State -->
          <div *ngIf="!loading() && filteredBills().length === 0" class="empty-state">
            <div class="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
            </div>
            <h3>No Bills Found</h3>
            <p>No bills match your current filters.</p>
            <button class="btn btn-primary" (click)="clearFilters()">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"/>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Bill Detail Modal -->
      <div *ngIf="selectedBill()" class="modal-overlay" (click)="closeBillDetail()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>
              <svg class="modal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
              Bill #{{ selectedBill()?.bill_number }}
            </h2>
            <button class="close-btn" (click)="closeBillDetail()">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <!-- Bill Details -->
            <div class="bill-details">
              <div class="detail-section">
                <h3>Bill Information</h3>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="label">Bill Number:</span>
                    <span class="value">{{ selectedBill()?.bill_number }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Customer:</span>
                    <span class="value customer-name">{{ selectedBill()?.customer_name || 'Walk-in Customer' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Table:</span>
                    <span class="value">{{ selectedBill()?.table_id || 'N/A' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Date:</span>
                    <span class="value">{{ formatDate(selectedBill()?.bill_date) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Status:</span>
                    <span class="value status-badge" [class]="getBillStatusClass(selectedBill()?.payment_status || 'pending')">
                      {{ getBillStatusText(selectedBill()?.payment_status || 'pending') }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Bill Products -->
              <div class="detail-section" *ngIf="selectedBill()?.products && selectedBill()?.products!.length > 0">
                <h3>Bill Items</h3>
                <div class="products-list">
                  <div *ngFor="let product of selectedBill()?.products" class="product-item">
                    <div class="product-info">
                      <div class="product-name">{{ product.product_name }}</div>
                      <div class="product-details">
                        <span class="quantity">Qty: {{ product.quantity }}</span>
                        <span class="unit-price">₺{{ formatPrice(product.unit_price) }} each</span>
                      </div>
                    </div>
                    <div class="product-total">
                      ₺{{ formatPrice(product.total_price) }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Bill Summary -->
              <div class="detail-section">
                <h3>Bill Summary</h3>
                <div class="summary-grid">
                  <div class="summary-row">
                    <span class="label">Subtotal:</span>
                    <span class="value">₺{{ formatPrice(selectedBill()?.subtotal) }}</span>
                  </div>
                  <div class="summary-row">
                    <span class="label">Tax:</span>
                    <span class="value">₺{{ formatPrice(selectedBill()?.tax_amount) }}</span>
                  </div>
                  <div class="summary-row">
                    <span class="label">Service Charge:</span>
                    <span class="value">₺{{ formatPrice(selectedBill()?.service_charge) }}</span>
                  </div>
                  <div class="summary-row">
                    <span class="label">Discount:</span>
                    <span class="value">-₺{{ formatPrice(selectedBill()?.discount_amount) }}</span>
                  </div>
                  <div class="summary-row total">
                    <span class="label">Total:</span>
                    <span class="value">₺{{ formatPrice(selectedBill()?.total_amount) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <!-- Left side - Bill Status Actions -->
            <div class="modal-actions-left">
              <button class="btn btn-success" 
                      (click)="openMarkPaidModal(selectedBill()!)" 
                      [disabled]="selectedBill()?.payment_status === 'paid' || selectedBill()?.payment_status === 'cancelled'">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.5 0 2.9.37 4.13 1.02"/>
                </svg>
                Mark as Paid
              </button>
              <button class="btn btn-warning" 
                      (click)="openCancelModal(selectedBill()!)" 
                      [disabled]="!selectedBill() || selectedBill()?.payment_status === 'paid' || selectedBill()?.payment_status === 'cancelled'">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 6L6 18"/>
                  <path d="M6 6l12 12"/>
                </svg>
                Cancel Bill
              </button>
            </div>
            
            <!-- Right side - Standard Actions -->
            <div class="modal-actions-right">
              <button class="btn btn-secondary" (click)="closeBillDetail()">
                Close
              </button>
              <button class="btn btn-primary" 
                      (click)="editBill(selectedBill()!)" 
                      [disabled]="selectedBill()?.payment_status === 'paid' || selectedBill()?.payment_status === 'cancelled'">
                Edit Bill
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cancel Confirmation Modal -->
    <div class="modal-overlay" *ngIf="showCancelModal()" (click)="closeCancelModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>
            <svg class="modal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Cancel Bill
          </h3>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to cancel this bill?</p>
          <div class="bill-info" *ngIf="selectedBill()">
            <p><strong>Bill Number:</strong> {{ selectedBill()?.bill_number }}</p>
            <p><strong>Customer:</strong> {{ selectedBill()?.customer_name || 'Unknown' }}</p>
            <p><strong>Table:</strong> {{ selectedBill()?.table_id || 'N/A' }}</p>
            <p><strong>Amount:</strong> ₺{{ formatPrice(selectedBill()?.total_amount) }}</p>
          </div>
          <p class="warning">⚠️ This action cannot be undone!</p>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" (click)="closeCancelModal()">Cancel</button>
          <button class="btn-warning" (click)="cancelBill(selectedBill()!)">Cancel Bill</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" *ngIf="showDeleteModal()" (click)="closeDeleteModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>
            <svg class="modal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
            Delete Bill
          </h3>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete this bill?</p>
          <div class="bill-info" *ngIf="deleteBill()">
            <p><strong>Bill Number:</strong> {{ deleteBill()?.bill_number }}</p>
            <p><strong>Customer:</strong> {{ deleteBill()?.customer_name || 'Unknown' }}</p>
            <p><strong>Table:</strong> {{ deleteBill()?.table_id || 'N/A' }}</p>
            <p><strong>Amount:</strong> ₺{{ formatPrice(deleteBill()?.total_amount) }}</p>
          </div>
          <p class="warning">⚠️ This will also delete all bill products and cannot be undone!</p>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" (click)="closeDeleteModal()">Cancel</button>
          <button class="btn-delete" (click)="confirmDeleteBill()" [disabled]="!deleteBill()">Delete</button>
        </div>
      </div>
    </div>

    <!-- Complete Bill Confirmation Modal -->
    <div class="modal-overlay" *ngIf="showCompleteModal()" (click)="closeCompleteModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>
            <svg class="modal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 12l2 2 4-4"/>
              <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.5 0 2.9.37 4.13 1.02"/>
            </svg>
            Complete Bill
          </h3>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to complete this bill?</p>
          <div class="bill-info" *ngIf="selectedBill()">
            <p><strong>Bill Number:</strong> {{ selectedBill()?.bill_number }}</p>
            <p><strong>Customer:</strong> {{ selectedBill()?.customer_name || 'Unknown' }}</p>
            <p><strong>Table:</strong> {{ selectedBill()?.table_id || 'N/A' }}</p>
            <p><strong>Amount:</strong> ₺{{ formatPrice(selectedBill()?.total_amount) }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" (click)="closeCompleteModal()">Cancel</button>
          <button class="btn-success" (click)="completeBill(selectedBill()!)">Complete Bill</button>
        </div>
      </div>
    </div>

    <!-- Mark as Paid Confirmation Modal -->
    <div class="modal-overlay" *ngIf="showMarkPaidModal()" (click)="closeMarkPaidModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>
            <svg class="modal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            Mark as Paid
          </h3>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to mark this bill as paid?</p>
          <div class="bill-info" *ngIf="selectedBill()">
            <p><strong>Bill Number:</strong> {{ selectedBill()?.bill_number }}</p>
            <p><strong>Customer:</strong> {{ selectedBill()?.customer_name || 'Unknown' }}</p>
            <p><strong>Table:</strong> {{ selectedBill()?.table_id || 'N/A' }}</p>
            <p><strong>Amount:</strong> ₺{{ formatPrice(selectedBill()?.total_amount) }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" (click)="closeMarkPaidModal()">Cancel</button>
          <button class="btn-success" (click)="markAsCompleted(selectedBill()!)">Mark as Paid</button>
        </div>
      </div>
    </div>

    <!-- Bill Edit Modal -->
    <div class="modal-overlay" *ngIf="showEditModal()" (click)="closeEditModal()">
      <div class="modal-content bill-edit-modal" (click)="$event.stopPropagation()">
        <app-bill-edit 
          [bill]="selectedBill()" 
          (close)="closeEditModal()"
          (saved)="closeEditModal(); loadBills()">
        </app-bill-edit>
      </div>
    </div>
  `,
  styleUrls: ['./billing-management.component.scss']
})
export class BillingManagementComponent implements OnInit {
  // Signals
  bills = signal<Bill[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  selectedBill = signal<Bill | null>(null);

  // Modal states
  showCancelModal = signal(false);
  showDeleteModal = signal(false);
  showCompleteModal = signal(false);
  showMarkPaidModal = signal(false);
  showEditModal = signal(false);
  
  // Separate signal for delete modal
  deleteBill = signal<Bill | null>(null);

  // Filters - Convert to signals for reactivity
  statusFilter = signal('');
  searchType = signal('');
  searchValue = signal('');
  dateFilter = signal('');

  // Computed
  filteredBills = computed(() => {
    let filtered = this.bills();

    if (this.statusFilter()) {
      filtered = filtered.filter(bill => bill.payment_status === this.statusFilter());
    }


    if (this.searchType() && this.searchValue()) {
      const searchType = this.searchType();
      const searchValue = this.searchValue().toLowerCase();

      filtered = filtered.filter(bill => {
        switch (searchType) {
          case 'bill_number':
            return bill.bill_number.toLowerCase().includes(searchValue);
          case 'customer_name':
            return bill.customer_name && bill.customer_name.toLowerCase().includes(searchValue);
          case 'customer_phone':
            return bill.customer_phone && bill.customer_phone.includes(searchValue);
          case 'table_id':
            return bill.table_id && bill.table_id.toString().includes(searchValue);
          default:
            return true;
        }
      });
    }

    if (this.dateFilter()) {
      filtered = filtered.filter(bill =>
        bill.bill_date.startsWith(this.dateFilter())
      );
    }

    return filtered;
  });

  constructor(
    private restaurantApi: RestaurantApiService,
    private toastService: ToastService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadBills();
  }

  async loadBills() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(this.restaurantApi.getAllBills());

      if (response?.success && response?.data) {
        // Map bill_status to payment_status
        const mappedBills = response.data.map((bill: any) => {
          let payment_status = 'pending';

          if (bill.bill_status === 'completed') {
            payment_status = 'paid';
          } else if (bill.bill_status === 'cancelled') {
            payment_status = 'cancelled';
          } else {
            // Safely map payment_status, default to 'pending' for unknown values
            const backendStatus = bill.payment_status;
            if (backendStatus === 'paid' || backendStatus === 'cancelled') {
              payment_status = backendStatus;
            } else {
              payment_status = 'pending';
            }
          }

          return {
            ...bill,
            payment_status: payment_status
          };
        });

        this.bills.set(mappedBills);

        // Update selectedBill if it exists
        const currentSelectedBill = this.selectedBill();
        if (currentSelectedBill) {
          const updatedBill = mappedBills.find(b => b.bill_id === currentSelectedBill.bill_id);
          if (updatedBill) {
            this.selectedBill.set(updatedBill);
          }
        }
      } else {
        this.error.set('Failed to load bills');
      }
    } catch (error) {
      this.error.set('Error loading bills');
    } finally {
      this.loading.set(false);
    }
  }

  onSearchTypeChange(newType: string) {
    this.searchType.set(newType);
    // Clear search value when type changes
    this.searchValue.set('');
    this.applyFilters();
  }

  applyFilters() {
    // Filters are applied automatically via computed signal
    // This method is called when filter inputs change
  }

  getSearchPlaceholder(): string {
    const searchType = this.searchType();
    switch (searchType) {
      case 'bill_number':
        return 'Enter bill number (e.g., 000001)';
      case 'customer_name':
        return 'Enter customer name';
      case 'customer_phone':
        return 'Enter phone number';
      case 'table_id':
        return 'Enter table ID (e.g., A-01)';
      default:
        return 'Select search type first';
    }
  }

  clearFilters() {
    this.statusFilter.set('');
    this.searchType.set('');
    this.searchValue.set('');
    this.dateFilter.set('');
  }

  async viewBill(bill: Bill) {
    try {
      // Load bill details first
      const billResponse = await firstValueFrom(this.restaurantApi.getBillById(bill.bill_id));

      if (billResponse?.success && billResponse?.data) {
        // Map bill_status to payment_status like in loadBills
        let payment_status: 'pending' | 'paid' | 'cancelled' = 'pending';

        if (billResponse.data.bill_status === 'completed') {
          payment_status = 'paid';
        } else if (billResponse.data.bill_status === 'cancelled') {
          payment_status = 'cancelled';
        } else {
          // Safely map payment_status, default to 'pending' for unknown values
          const backendStatus = billResponse.data.payment_status;
          if (backendStatus === 'paid' || backendStatus === 'cancelled') {
            payment_status = backendStatus;
          } else {
            payment_status = 'pending';
          }
        }

        // Products are now included directly in the bill response
        let products: any[] = [];
        if (billResponse.data.products && Array.isArray(billResponse.data.products)) {
          products = billResponse.data.products;
        }

        const mappedBill = {
          ...billResponse.data,
          payment_status: payment_status,
          products: products
        };

        this.selectedBill.set(mappedBill);
      } else {
        this.toastService.error('Error', 'Failed to load bill details');
      }
    } catch (error) {
      this.toastService.error('Error', 'Failed to load bill details');
    }
  }

  editBill(bill: Bill) {
    this.selectedBill.set(bill);
    this.showEditModal.set(true);
  }




  // Bill Status Management Methods
  openCompleteModal(bill: Bill) {
    this.selectedBill.set(bill);
    this.showCompleteModal.set(true);
  }

  async completeBill(bill: Bill) {
    try {
      const response = await firstValueFrom(this.restaurantApi.completeBill(bill.bill_id));

      if (response?.success) {
        this.toastService.success('Success', 'Bill completed successfully');
        this.loadBills();
        this.closeCompleteModal();
      } else {
        this.toastService.error('Error', 'Failed to complete bill');
      }
    } catch (error) {
      this.toastService.error('Error', 'Failed to complete bill');
    }
  }

  // Alias for modal usage
  openMarkPaidModal(bill: Bill) {
    this.selectedBill.set(bill);
    this.showMarkPaidModal.set(true);
  }

  async markAsCompleted(bill: Bill) {
    if (!bill) {
      return;
    }

    try {
      const response = await firstValueFrom(this.restaurantApi.completeBill(bill.bill_id));

      if (response?.success) {
        this.toastService.success('Success', 'Bill marked as completed successfully');
        // Reload bills to get updated data from API
        this.loadBills();
        // Update selectedBill in modal
        this.selectedBill.set({
          ...bill,
          payment_status: 'paid',
          bill_status: 'completed'
        });
        this.closeMarkPaidModal();
      } else {
        this.toastService.error('Error', 'Failed to mark bill as completed');
      }
    } catch (error) {
      this.toastService.error('Error', 'Failed to mark bill as completed');
    }
  }

  async cancelBill(bill: Bill) {
    try {
      const response = await firstValueFrom(this.restaurantApi.cancelBill(bill.bill_id));

      if (response?.success) {
        this.toastService.success('Success', 'Bill cancelled successfully');
        this.loadBills();
        // Update selectedBill in modal
        this.selectedBill.set({
          ...bill,
          payment_status: 'cancelled',
          bill_status: 'cancelled'
        });
        this.closeCancelModal();
      } else {
        this.toastService.error('Error', 'Failed to cancel bill');
      }
    } catch (error) {
      this.toastService.error('Error', 'Failed to cancel bill');
    }
  }

  async deleteBillMethod(bill: Bill | null) {
    if (!bill || !bill.bill_id) {
      this.toastService.error('Error', 'Invalid bill data');
      return;
    }

    try {
      // First, try to delete all products from the bill
      if (bill.products && bill.products.length > 0) {
        for (const product of bill.products) {
          try {
            await firstValueFrom(this.restaurantApi.deleteBillProduct(product.bill_product_id));
          } catch (productError) {
            // Continue with other products
          }
        }
      }

      // Now try to delete the bill
      const response = await firstValueFrom(this.restaurantApi.deleteBill(bill.bill_id));

      if (response?.success) {
        this.toastService.success('Success', 'Bill deleted successfully');
        this.loadBills();
        this.closeDeleteModal();
      } else {
        this.toastService.error('Error', response?.message || 'Failed to delete bill');
      }
    } catch (error: any) {
      // Check if it's a 400 error about products
      if (error.status === 400 && error.error?.error?.includes('has products')) {
        this.toastService.warning('Warning', 'Bill has products. Attempting to force delete...');
        
        // Try to reload and delete again
        setTimeout(() => {
          this.loadBills();
          this.closeDeleteModal();
        }, 1000);
      } else {
        this.toastService.error('Error', 'Failed to delete bill');
      }
    }
  }

  async updateBillStatus(bill: Bill, newStatus: 'pending' | 'completed' | 'cancelled') {
    try {
      const response = await firstValueFrom(this.restaurantApi.updateBillStatus(bill.bill_id, newStatus));

      if (response?.success) {
        this.toastService.success('Success', `Bill status updated to ${newStatus}`);
        this.loadBills();
      } else {
        this.toastService.error('Error', 'Failed to update bill status');
      }
    } catch (error) {
      this.toastService.error('Error', 'Failed to update bill status');
    }
  }

  // Bill Status Helper Methods
  getBillStatusClass(payment_status: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'status-pending',
      'paid': 'status-paid',
      'cancelled': 'status-cancelled',
    };
    return statusClasses[payment_status] || 'status-default';
  }

  getBillStatusText(payment_status: string): string {
    const statusTexts: { [key: string]: string } = {
      'pending': 'Pending',
      'paid': 'Paid',
      'cancelled': 'Cancelled',
    };
    return statusTexts[payment_status] || payment_status;
  }

  closeBillDetail() {
    this.selectedBill.set(null);
  }

  // Modal methods
  openCancelModal(bill: Bill) {
    this.selectedBill.set(bill);
    this.showCancelModal.set(true);
  }

  closeCancelModal() {
    this.showCancelModal.set(false);
  }

  openDeleteModal(bill: Bill) {
    this.deleteBill.set(bill);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.deleteBill.set(null);
  }

  confirmDeleteBill() {
    this.deleteBillMethod(this.deleteBill());
  }

  closeCompleteModal() {
    this.showCompleteModal.set(false);
  }

  closeMarkPaidModal() {
    this.showMarkPaidModal.set(false);
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.selectedBill.set(null);
  }

  // Utility methods
  formatPrice(price: any): string {
    if (price === null || price === undefined) return '0.00';
    return Number(price).toFixed(2);
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('tr-TR');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'paid': return 'status-paid';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-unknown';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Pending';
      case 'paid': return 'Paid';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  }

}
