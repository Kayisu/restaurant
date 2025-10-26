import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservationService } from '../../core/services/reservation.service';
import { CustomerService } from '../../core/services/customer.service';
import { ToastService } from '../../core/services/toast.service';
import { RestaurantApiService } from '../../core/services/restaurant-api.service';
import { Reservation } from '../../shared/interfaces/restaurant.interface';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-edit-reservation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="edit-reservation">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <div class="title-section">
            <svg class="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <h1>Edit Reservation</h1>
          </div>
          <button class="btn btn-outline" (click)="goBack()">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Dashboard
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading()">
        <svg class="loading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 12a9 9 0 11-6.364-6.364L21 12"/>
        </svg>
        <p>Loading reservation details...</p>
      </div>

      <!-- Error State -->
      <div class="error-state" *ngIf="error() && !loading()">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <p>{{ error() }}</p>
        <button class="btn btn-primary" (click)="loadReservation()">Retry</button>
      </div>

      <!-- Form -->
      <div class="form-container" *ngIf="!loading() && !error()">
        <form [formGroup]="reservationForm" (ngSubmit)="onSubmit()" class="reservation-form">
          <!-- Customer Information -->
          <div class="form-section">
            <div class="section-header">
              <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <h3>Customer Information</h3>
            </div>
            
            <div class="form-grid">
              <div class="form-group">
                <label for="customer_name">Customer Name *</label>
                <input 
                  type="text" 
                  id="customer_name"
                  formControlName="customer_name" 
                  class="form-control readonly-field"
                  readonly
                  placeholder="Customer name (cannot be changed)">
                <div class="readonly-note">
                  <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4"/>
                    <path d="M12 8h.01"/>
                  </svg>
                  Customer name cannot be changed. Delete and create a new reservation if needed.
                </div>
              </div>

              <div class="form-group">
                <label for="customer_phone">Phone Number *</label>
                <input 
                  type="tel" 
                  id="customer_phone"
                  formControlName="customer_phone" 
                  class="form-control readonly-field"
                  readonly
                  placeholder="Phone number (cannot be changed)">
                <div class="readonly-note">
                  <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4"/>
                    <path d="M12 8h.01"/>
                  </svg>
                  Phone number cannot be changed. Delete and create a new reservation if needed.
                </div>
              </div>

              <div class="form-group">
                <label for="customer_email">Email Address</label>
                <input 
                  type="email" 
                  id="customer_email"
                  formControlName="customer_email" 
                  class="form-control"
                  [class.error]="reservationForm.get('customer_email')?.invalid && reservationForm.get('customer_email')?.touched"
                  placeholder="Enter email address">
                <div class="error-message" *ngIf="reservationForm.get('customer_email')?.invalid && reservationForm.get('customer_email')?.touched">
                  Please enter a valid email address
                </div>
              </div>

              <div class="form-group">
                <label for="customer_address">Address</label>
                <input 
                  type="text" 
                  id="customer_address"
                  formControlName="customer_address" 
                  class="form-control"
                  placeholder="Enter address">
              </div>
            </div>
          </div>

          <!-- Reservation Details -->
          <div class="form-section">
            <div class="section-header">
              <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M8 2v4"/>
                <path d="M16 2v4"/>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <path d="M3 10h18"/>
              </svg>
              <h3>Reservation Details</h3>
            </div>
            
            <div class="form-grid">
              <div class="form-group">
                <label for="table_id">Table ID *</label>
                <input 
                  type="text" 
                  id="table_id"
                  formControlName="table_id" 
                  class="form-control"
                  [class.error]="reservationForm.get('table_id')?.invalid && reservationForm.get('table_id')?.touched"
                  [readonly]="true"
                  [value]="getTableDisplayValue()"
                  placeholder="Table ID (fixed)">
                <div class="error-message" *ngIf="reservationForm.get('table_id')?.invalid && reservationForm.get('table_id')?.touched">
                  Table ID is required
                </div>
              </div>

              <div class="form-group">
                <label for="party_size">Party Size *</label>
                <input 
                  type="number" 
                  id="party_size"
                  formControlName="party_size" 
                  class="form-control"
                  [class.error]="reservationForm.get('party_size')?.invalid && reservationForm.get('party_size')?.touched"
                  placeholder="Enter party size"
                  min="1"
                  max="20">
                <div class="error-message" *ngIf="reservationForm.get('party_size')?.invalid && reservationForm.get('party_size')?.touched">
                  <span *ngIf="reservationForm.get('party_size')?.errors?.['exceedsCapacity']">
                    Party size exceeds table capacity
                  </span>
                  <span *ngIf="!reservationForm.get('party_size')?.errors?.['exceedsCapacity']">
                    Party size must be between 1 and 20
                  </span>
                </div>
              </div>

              <div class="form-group">
                <label for="reservation_date">Reservation Date *</label>
                <input 
                  type="date" 
                  id="reservation_date"
                  formControlName="reservation_date" 
                  class="form-control"
                  [min]="today"
                  [class.error]="reservationForm.get('reservation_date')?.invalid && reservationForm.get('reservation_date')?.touched">
                <div class="error-message" *ngIf="reservationForm.get('reservation_date')?.invalid && reservationForm.get('reservation_date')?.touched">
                  Reservation date is required
                </div>
              </div>

              <div class="form-group">
                <label for="reservation_time">Reservation Time *</label>
                <div class="time-dropdown-container">
                  <input 
                    type="text" 
                    id="reservation_time"
                    formControlName="reservation_time" 
                    class="form-control time-input"
                    [class.error]="reservationForm.get('reservation_time')?.invalid && reservationForm.get('reservation_time')?.touched"
                    (click)="toggleTimeDropdown()"
                    readonly
                    placeholder="Select time">
                  <svg class="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6,9 12,15 18,9"/>
                  </svg>
                  
                  <div class="time-dropdown" *ngIf="showTimeDropdown()">
                    <div class="time-options">
                      <div 
                        class="time-option" 
                        *ngFor="let time of availableTimes()"
                        (click)="selectTime(time)"
                        [class.selected]="reservationForm.get('reservation_time')?.value === time"
                      >
                        {{ time }}
                      </div>
                    </div>
                  </div>
                </div>
                <div class="error-message" *ngIf="reservationForm.get('reservation_time')?.invalid && reservationForm.get('reservation_time')?.touched">
                  <span *ngIf="reservationForm.get('reservation_time')?.errors?.['required']">
                    Reservation time is required
                  </span>
                  <span *ngIf="reservationForm.get('reservation_time')?.errors?.['invalidTimeInterval']">
                    Time must be in 10-minute intervals
                  </span>
                  <span *ngIf="reservationForm.get('reservation_time')?.errors?.['invalidTimeRange']">
                    Time must be between 11:00 and 23:00
                  </span>
                  <span *ngIf="reservationForm.get('reservation_time')?.errors?.['pastTime']">
                    Cannot select a time in the past
                  </span>
                </div>
              </div>

            </div>
          </div>

          <!-- Additional Information -->
          <div class="form-section">
            <div class="section-header">
              <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
              <h3>Additional Information</h3>
            </div>
            
            <div class="form-group full-width">
              <label for="notes">Notes</label>
              <textarea 
                id="notes"
                formControlName="notes" 
                class="form-control textarea"
                rows="4"
                placeholder="Enter any special notes or requests..."></textarea>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button type="button" class="btn btn-outline" (click)="goBack()">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Dashboard
            </button>
            
            <button 
              type="button" 
              class="btn btn-success" 
              *ngIf="canSeatCustomer()" 
              (click)="seatCustomer()"
            >
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
              Seat Customer
            </button>
            
            <button type="submit" class="btn btn-primary" [disabled]="reservationForm.invalid || saving()">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" *ngIf="!saving()">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17,21 17,13 7,13 7,21"/>
                <polyline points="7,3 7,8 15,8"/>
              </svg>
              <svg class="btn-icon loading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" *ngIf="saving()">
                <path d="M21 12a9 9 0 11-6.364-6.364L21 12"/>
              </svg>
              {{ saving() ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .edit-reservation {
      padding: 1.5rem;
      max-width: 800px;
      margin: 0 auto;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      min-height: 100vh;
    }

    .header {
      margin-bottom: 1.5rem;
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(98, 100, 196, 0.1);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .title-section {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: linear-gradient(135deg, #6264c4 0%, #5859c7 100%);
      border-radius: 8px;
      color: white;
    }

    .header-icon {
      width: 2rem;
      height: 2rem;
      color: white;
    }

    .title-section h1 {
      margin: 0;
      color: white;
      font-size: 1.25rem;
      font-weight: 600;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .loading-state, .error-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(98, 100, 196, 0.1);
    }

    .loading-icon, .error-icon {
      width: 3rem;
      height: 3rem;
      margin-bottom: 1rem;
      color: #6c757d;
    }

    .loading-icon {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .error-icon {
      color: #dc3545;
    }

    .form-container {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(98, 100, 196, 0.1);
    }

    .reservation-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-section {
      border: 2px solid #e9ecef;
      border-radius: 8px;
      padding: 1.5rem;
      background: #f8f9fa;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #6264c4;
    }

    .section-icon {
      width: 1.5rem;
      height: 1.5rem;
      color: #6264c4;
    }

    .section-header h3 {
      margin: 0;
      color: #6264c4;
      font-size: 1.125rem;
      font-weight: 700;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      font-weight: 600;
      color: #495057;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .form-control {
      padding: 0.75rem;
      border: 2px solid #e9ecef;
      border-radius: 6px;
      font-size: 0.875rem;
      transition: all 0.3s ease;
      background: white;
    }

    .form-control:focus {
      outline: none;
      border-color: #6264c4;
      box-shadow: 0 0 0 4px rgba(98, 100, 196, 0.1);
    }

    .form-control.error {
      border-color: #dc3545;
      box-shadow: 0 0 0 4px rgba(220, 53, 69, 0.1);
    }

    .form-control.textarea {
      resize: vertical;
      min-height: 100px;
    }

    .form-control.readonly-field {
      background-color: #f8f9fa;
      color: #6c757d;
      cursor: not-allowed;
      border-color: #dee2e6;
    }

    .readonly-note {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
      padding: 0.75rem;
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      color: #6c757d;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .info-icon {
      width: 1rem;
      height: 1rem;
      color: #6c757d;
      flex-shrink: 0;
    }

    .error-message {
      color: #dc3545;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding-top: 1.5rem;
      border-top: 2px solid #e9ecef;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: linear-gradient(135deg, #6264c4 0%, #5859c7 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(98, 100, 196, 0.4);
    }

    .btn-outline {
      background: transparent;
      color: #6264c4;
      border: 2px solid #6264c4;
    }

    .btn-outline:hover:not(:disabled) {
      background: linear-gradient(135deg, #6264c4 0%, #5859c7 100%);
      color: white;
      transform: translateY(-2px);
    }

    .btn-icon {
      width: 1.25rem;
      height: 1.25rem;
    }

    .btn-icon.loading {
      animation: spin 1s linear infinite;
    }

    @media (max-width: 768px) {
      .edit-reservation {
        padding: 1rem;
        margin: 0.5rem;
        border-radius: 12px;
      }

      .header {
        margin-bottom: 1rem;
        padding: 1rem;

        .header-content {
          flex-direction: column;
          gap: 0.75rem;
          text-align: center;

          .title-section {
            padding: 0.5rem 0.75rem;
            
            h1 {
              font-size: 1.25rem;
            }
          }

          .btn {
            align-self: stretch;
            justify-content: center;
            padding: 0.75rem;
            font-size: 0.9rem;
          }
        }
      }

      .form-container {
        padding: 1rem;
        border-radius: 8px;
      }

      .form-section {
        padding: 1rem;
        margin-bottom: 1rem;

        .section-header {
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;

          h3 {
            font-size: 1rem;
          }

          .section-icon {
            width: 1.25rem;
            height: 1.25rem;
          }
        }
      }

      .form-grid {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }

      .form-group {
        margin-bottom: 0.75rem;

        label {
          font-size: 0.8rem;
          margin-bottom: 0.25rem;
        }

        .form-control {
          padding: 0.75rem;
          font-size: 0.9rem;
          border-radius: 6px;
        }

        .form-control.textarea {
          min-height: 80px;
        }

        .readonly-note {
          padding: 0.5rem;
          font-size: 0.8rem;
          margin-top: 0.25rem;

          .info-icon {
            width: 0.875rem;
            height: 0.875rem;
          }
        }
      }

      .form-actions {
        flex-direction: column;
        gap: 0.5rem;
        padding-top: 1rem;

        .btn {
          width: 100%;
          justify-content: center;
          padding: 0.75rem;
          font-size: 0.9rem;
        }
      }

      .loading-state, .error-state {
        padding: 2rem 1rem;

        .loading-icon, .error-icon {
          width: 2.5rem;
          height: 2.5rem;
          margin-bottom: 0.75rem;
        }

        h3 {
          font-size: 1.1rem;
        }

        p {
          font-size: 0.9rem;
        }

        .btn {
          padding: 0.75rem 1rem;
          font-size: 0.9rem;
        }
      }
    }

    @media (max-width: 480px) {
      .edit-reservation {
        padding: 0.75rem;
        margin: 0.25rem;
      }

      .header {
        padding: 0.75rem;

        .header-content {
          .title-section {
            padding: 0.5rem;
            
            h1 {
              font-size: 1.1rem;
            }
          }
        }
      }

      .form-container {
        padding: 0.75rem;
      }

      .form-section {
        padding: 0.75rem;

        .section-header {
          h3 {
            font-size: 0.9rem;
          }
        }
      }

      .form-group {
        .form-control {
          padding: 0.5rem;
          font-size: 0.85rem;
        }

        .readonly-note {
          padding: 0.5rem;
          font-size: 0.75rem;
        }
      }

      .form-actions {
        .btn {
          padding: 0.75rem;
          font-size: 0.85rem;
        }
      }
    }

    //Switch Styles 
    .switch-container {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .switch {
      position: relative;
      display: inline-block;
      width: 60px;
      height: 34px;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: .4s;
      border-radius: 34px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 26px;
      width: 26px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
    }

    input:checked + .slider:before {
      transform: translateX(26px);
    }

    //Time Dropdown Styles 
    .time-dropdown-container {
      position: relative;
    }

    .time-input {
      cursor: pointer;
      padding-right: 2.5rem;
    }

    .dropdown-icon {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      width: 1rem;
      height: 1rem;
      color: #6c757d;
      pointer-events: none;
    }

    .time-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 2px solid #e9ecef;
      border-top: none;
      border-radius: 0 0 6px 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      max-height: 200px;
      overflow-y: auto;
    }

    .time-options {
      display: flex;
      flex-direction: column;
    }

    .time-option {
      padding: 0.75rem;
      cursor: pointer;
      border-bottom: 1px solid #f8f9fa;
      transition: all 0.2s ease;
      font-size: 0.875rem;
      color: #495057;
    }

    .time-option:hover {
      background: #f8f9fa;
      color: #6264c4;
    }

    .time-option.selected {
      background: linear-gradient(135deg, #6264c4 0%, #5859c7 100%);
      color: white;
      font-weight: 600;
    }

    .time-option:last-child {
      border-bottom: none;
    }

  `]
})
export class EditReservationComponent implements OnInit {
  reservationForm!: FormGroup;
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  reservation = signal<Reservation | null>(null);
  tableCapacity = signal<number>(0);
  reservationId!: number;
  today = new Date().toISOString().split('T')[0];
  
  // Time dropdown state
  showTimeDropdown = signal(false);
  availableTimes = signal<string[]>([]);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private reservationService: ReservationService,
    private customerService: CustomerService,
    private toastService: ToastService,
    private restaurantApi: RestaurantApiService
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.reservationId = +this.route.snapshot.paramMap.get('id')!;
    this.generateAvailableTimes();
    this.loadReservation();
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.time-dropdown-container')) {
        this.showTimeDropdown.set(false);
      }
    });
  }

  initializeForm() {
    this.reservationForm = this.fb.group({
      customer_name: [''], // Readonly - no validation needed
      customer_phone: [''], // Readonly - no validation needed
      customer_email: ['', [Validators.email]],
      customer_address: [''],
      table_id: ['', [Validators.required]],
      party_size: ['', [Validators.required, Validators.min(1), Validators.max(20)]],
      reservation_date: ['', [Validators.required]],
      reservation_time: ['', [Validators.required, this.timeValidator.bind(this)]],
      notes: ['']
    });

    // Watch table_id changes to validate party size against table capacity
    this.reservationForm.get('table_id')?.valueChanges.subscribe(tableId => {
      if (tableId) {
        this.validatePartySizeAgainstTable(tableId);
      }
    });

    // Watch party_size changes to validate against table capacity
    this.reservationForm.get('party_size')?.valueChanges.subscribe((partySize) => {
      const tableId = this.reservationForm.get('table_id')?.value;
      if (tableId && partySize) {
        this.validatePartySizeAgainstTable(tableId);
      }
    });
  }

  getTableDisplayValue(): string {
    const tableId = this.reservationForm.get('table_id')?.value;
    const capacity = this.tableCapacity();
    return tableId ? `${tableId} - Capacity: ${capacity}` : '';
  }

  async validatePartySizeAgainstTable(tableId: string) {
    try {
      
      // Get table capacity from backend
      const tableResponse = await firstValueFrom(this.restaurantApi.getTableById(tableId));
      if (tableResponse?.success && tableResponse.data) {
        const tableCapacity = tableResponse.data.capacity;
        this.tableCapacity.set(tableCapacity);
        
        
        const partySizeControl = this.reservationForm.get('party_size');
        const partySize = partySizeControl?.value;
        
        
        if (partySizeControl && partySize && partySize > tableCapacity) {
          partySizeControl.setErrors({ exceedsCapacity: true });
        } else if (partySizeControl) {
          // Clear the error if party size is within capacity
          const currentErrors = partySizeControl.errors;
          if (currentErrors?.['exceedsCapacity']) {
            delete currentErrors['exceedsCapacity'];
            partySizeControl.setErrors(Object.keys(currentErrors).length > 0 ? currentErrors : null);
          }
        }
      }
    } catch (error) {
    }
  }

  async loadReservation() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await this.reservationService.getReservationById(this.reservationId).toPromise();
      
      if (response?.success && response.data) {
        const reservation = response.data;
        
        // Store reservation data in signal
        this.reservation.set(reservation);
        
        // Format date and time for input fields
        const formattedDate = this.formatDateForInput(reservation.reservation_date || '');
        // Use formatted_time if available, otherwise format raw reservation_time
        const formattedTime = reservation.formatted_time || this.formatTimeForInput(reservation.reservation_time || '');
        

        // If customer_address is undefined, fetch customer data separately
        let customerAddress = reservation.customer_address || '';
        if (!customerAddress && reservation.customer_id) {
          try {
            const customerResponse = await this.customerService.getCustomerById(reservation.customer_id).toPromise();
            if (customerResponse?.success && customerResponse.data) {
              customerAddress = customerResponse.data.address || '';
            }
          } catch (error) {
          }
        }

        this.reservationForm.patchValue({
          customer_name: reservation.customer_name || '',
          customer_phone: reservation.customer_phone || '',
          customer_email: reservation.customer_email || '',
          customer_address: customerAddress,
          table_id: reservation.table_id || '',
          party_size: reservation.party_size || '',
          reservation_date: formattedDate,
          reservation_time: formattedTime,
          notes: reservation.notes || ''
        });


        // Load table capacity for validation
        if (reservation.table_id) {
          this.validatePartySizeAgainstTable(reservation.table_id);
        }

      } else {
        throw new Error('Reservation not found');
      }
    } catch (error: any) {
      this.error.set(error.message || 'Failed to load reservation');
      this.toastService.error('Error', 'Failed to load reservation');
    } finally {
      this.loading.set(false);
    }
  }

  formatDateForInput(dateString: string): string {
    // Convert from DD/MM/YYYY to YYYY-MM-DD
    if (!dateString) return '';
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateString;
  }

  formatTimeForInput(timeString: string): string {
    // Convert from HH:MM:SS to HH:MM (remove seconds if present)
    if (!timeString) return '';
    // If time includes seconds (HH:MM:SS), extract only HH:MM
    return timeString.substring(0, 5);
  }


  async onSubmit() {
    if (this.reservationForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.saving.set(true);

    try {
      const formValue = this.reservationForm.value;
      
      
      // First, get the current reservation to get customer_id
      const currentReservationResponse = await this.reservationService.getReservationById(this.reservationId).toPromise();
      
      if (!currentReservationResponse?.success || !currentReservationResponse.data) {
        throw new Error('Failed to load current reservation');
      }

      const currentReservation = currentReservationResponse.data;
      const customerId = currentReservation.customer_id;
      const oldTableId = currentReservation.table_id;

      // Update customer information if customer_id exists (only email and address)
      if (customerId) {
        const customerUpdateData = {
          email: formValue.customer_email || null,
          address: formValue.customer_address || null
        };


        try {
          const customerResponse = await this.customerService.updateCustomer(customerId, customerUpdateData).toPromise();
          
          if (!customerResponse?.success) {
            this.toastService.error('Customer Update Failed', 'Failed to update customer information. Please try again.');
            this.saving.set(false);
            return;
          } else {
            this.toastService.success('Success', 'Customer information updated successfully');
          }
        } catch (error: any) {
          this.toastService.error('Customer Update Error', `Error updating customer: ${error?.error?.message || error?.message || 'Unknown error'}`);
          this.saving.set(false);
          return;
        }
      } else {
        this.toastService.warning('Warning', 'No customer ID found. Customer information cannot be updated.');
      }

      // Prepare reservation update data
      const updateData = {
        table_id: formValue.table_id,
        party_size: formValue.party_size,
        reservation_date: formValue.reservation_date,
        reservation_time: formValue.reservation_time,
        notes: formValue.notes || ''
      };


      const response = await this.reservationService.updateReservation(this.reservationId, updateData).toPromise();
      
      if (response?.success) {
        // Update table statuses if table changed
        if (oldTableId !== formValue.table_id) {
          try {
            // Free up old table
            await firstValueFrom(
              this.restaurantApi.updateTableStatus(oldTableId, {
                is_occupied: false,
                is_reserved: false,
                table_status: 'available'
              })
            );
            
            // Reserve new table
            await firstValueFrom(
              this.restaurantApi.updateTableStatus(formValue.table_id, {
                is_occupied: false,
                is_reserved: true,
                table_status: 'reserved'
              })
            );
          } catch (tableError) {
          }
        }

        
        this.router.navigate(['/reservations']);
      } else {
        throw new Error('Failed to update reservation');
      }
    } catch (error: any) {
      this.toastService.error('Error', error.message || 'Failed to update reservation');
    } finally {
      this.saving.set(false);
    }
  }

  markFormGroupTouched() {
    Object.keys(this.reservationForm.controls).forEach(key => {
      const control = this.reservationForm.get(key);
      control?.markAsTouched();
    });
  }

  // Check if customer can be seated (within 15 minutes of reservation time or overdue)
  canSeatCustomer(): boolean {
    const reservation = this.reservation();
    if (!reservation) return false;
    
    const now = new Date();
    let reservationTime: Date;
    
    if (reservation.reservation_date && reservation.reservation_time) {
      reservationTime = new Date(`${reservation.reservation_date}T${reservation.reservation_time}`);
    } else {
      return false;
    }
    
    if (isNaN(reservationTime.getTime())) {
      return false;
    }
    
    const timeDiff = reservationTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    const status = reservation.reservation_status || reservation.status;
    
    // Can seat if overdue (confirmed and past time) or within 15 minutes of reservation time
    return status === 'confirmed' && (minutesDiff < 0 || minutesDiff <= 15);
  }

  // Seat customer and create order
  async seatCustomer() {
    const reservation = this.reservation();
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

      // 3. Seat the customer
      const seatResponse = await firstValueFrom(
        this.restaurantApi.seatCustomer(reservation.table_id, reservation.customer_id)
      );
      
      if (!seatResponse?.success) {
        this.toastService.error('Seating Failed', seatResponse?.message || 'Failed to seat the customer');
        return;
      }
      
      // 4. Update reservation status to completed
      const updateResponse = await firstValueFrom(
        this.reservationService.updateReservation(reservation.reservation_id, { status: 'completed' })
      );
      
      if (!updateResponse?.success) {
        this.toastService.error('Status Update Failed', updateResponse?.message || 'Customer seated but failed to update reservation status');
        return;
      }
      
      this.toastService.success('Customer Seated', 'Customer has been seated and reservation completed');
      
      // 5. Reload the reservation to show updated status
      this.loadReservation();
      
    } catch (error: any) {
      this.toastService.error('Error', error.message || 'Failed to seat customer');
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  // Time validation
  timeValidator(control: any) {
    if (!control.value) return null;
    
    const time = control.value;
    const [hours, minutes] = time.split(':').map(Number);

    // Business hours: 11:00 - 23:00 (11 AM - 11:00 PM)
    const openHour = 11;
    const closeHour = 23;

    if (hours < openHour || hours > closeHour) {
      return { invalidTimeRange: true };
    }

    // Check if time is in 10-minute intervals
    if (minutes % 10 !== 0) {
      return { invalidTimeInterval: true };
    }

    // Check if reservation is for today and time is in the past
    const selectedDate = this.reservationForm?.get('reservation_date')?.value;
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
    this.showTimeDropdown.set(!this.showTimeDropdown());
  }

  selectTime(time: string) {
    this.reservationForm.patchValue({ reservation_time: time });
    this.showTimeDropdown.set(false);
  }
}
