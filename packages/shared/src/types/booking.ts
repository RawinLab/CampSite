// Booking types for Camping Thailand

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'partially_refunded';

export interface BookingGuestInfo {
  name: string;
  phone: string;
  email: string;
  idCard?: string;
}

export interface BookingAccommodation {
  id: string;
  bookingId: string;
  accommodationTypeId: string;
  accommodationTypeName?: string;
  quantity: number;
  pricePerNight: number;
  totalPrice: number;
}

export interface Booking {
  id: string;
  campsiteId: string;
  campsiteName?: string;
  campsiteThumbnail?: string;
  userId: string;
  
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number;
  nightsCount: number;
  
  totalPrice: number;
  serviceFee: number;
  discountAmount: number;
  
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  
  specialRequests?: string;
  guestInfo?: BookingGuestInfo;
  
  cancelledAt?: string;
  cancellationReason?: string;
  refundAmount?: number;
  
  accommodations?: BookingAccommodation[];
  
  createdAt: string;
  updatedAt: string;
}

// API Input/Output types
export interface CreateBookingInput {
  campsiteId: string;
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number;
  specialRequests?: string;
  guestInfo: BookingGuestInfo;
  accommodations: {
    accommodationTypeId: string;
    quantity: number;
  }[];
}

export interface UpdateBookingInput {
  specialRequests?: string;
  guestInfo?: Partial<BookingGuestInfo>;
}

export interface CancelBookingInput {
  reason: string;
}

export interface CheckAvailabilityInput {
  campsiteId: string;
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number;
}

export interface CheckAvailabilityResponse {
  available: boolean;
  availableAccommodations: {
    accommodationTypeId: string;
    name: string;
    availableQuantity: number;
    pricePerNight: number;
  }[];
  totalPrice: number;
  nightsCount: number;
  message?: string;
}

export interface BookingResponse {
  success: boolean;
  data: Booking;
  message?: string;
}

export interface BookingsListResponse {
  success: boolean;
  data: {
    data: Booking[];
    total: number;
    page: number;
    limit: number;
  };
}

// Query params
export interface BookingsQueryParams {
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'check_in_date' | 'total_price';
  sortOrder?: 'asc' | 'desc';
}
