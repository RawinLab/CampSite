import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { authMiddleware } from '../middleware/auth';
import logger from '../utils/logger';
import type { BookingStatus, PaymentStatus } from '@campsite/shared';

// Use supabaseAdmin as default to bypass RLS and ensure tables exist
const supabase = supabaseAdmin;

const router = Router();

// Get user's bookings
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { 
      status, 
      paymentStatus, 
      page = '1', 
      limit = '10',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('bookings')
      .select(`
        *,
        campsites:campsite_id (name, thumbnail_url)
      `, { count: 'exact' })
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status as BookingStatus);
    }

    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus as PaymentStatus);
    }

    const { data, error, count } = await query
      .order(sortBy as string, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limitNum - 1);

    if (error) {
      logger.error('Error fetching bookings:', error);
      return res.status(500).json({ success: false, message: error.message });
    }

    const bookings = data.map((booking: any) => ({
      ...booking,
      campsiteName: booking.campsites?.name,
      campsiteThumbnail: booking.campsites?.thumbnail_url,
    }));

    res.json({
      success: true,
      data: {
        data: bookings,
        total: count || 0,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get booking by ID
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        campsites:campsite_id (*),
        booking_accommodations:booking_accommodations (
          *,
          accommodation_type:accommodation_type_id (*)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check ownership
    if (booking.user_id !== userId) {
      // Check if user is campsite owner
      const { data: campsite } = await supabase
        .from('campsites')
        .select('owner_id')
        .eq('id', booking.campsite_id)
        .single();
      
      if (campsite?.owner_id !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
});

// Create booking
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const {
      campsiteId,
      checkInDate,
      checkOutDate,
      guestsCount,
      specialRequests,
      guestInfo,
      accommodations,
    } = req.body;

    // Validate required fields
    if (!campsiteId || !checkInDate || !checkOutDate || !guestsCount || !guestInfo) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Calculate nights and total price
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid dates',
      });
    }

    // Calculate total price from accommodations
    let totalPrice = 0;
    for (const acc of accommodations || []) {
      const { data: accType } = await supabase
        .from('accommodation_types')
        .select('base_price')
        .eq('id', acc.accommodationTypeId)
        .single();
      
      if (accType) {
        totalPrice += accType.base_price * acc.quantity * nights;
      }
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        campsite_id: campsiteId,
        user_id: userId,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        guests_count: guestsCount,
        nights_count: nights,
        total_price: totalPrice,
        special_requests: specialRequests,
        guest_info: guestInfo,
        status: 'pending',
        payment_status: 'unpaid',
      })
      .select()
      .single();

    if (bookingError) {
      logger.error('Error creating booking:', bookingError);
      return res.status(500).json({ success: false, message: bookingError.message });
    }

    // Insert booking accommodations
    if (accommodations && accommodations.length > 0) {
      const bookingAccs = accommodations.map((acc: any) => ({
        booking_id: booking.id,
        accommodation_type_id: acc.accommodationTypeId,
        quantity: acc.quantity,
        price_per_night: acc.pricePerNight || 0,
        total_price: (acc.pricePerNight || 0) * acc.quantity * nights,
      }));

      const { error: accError } = await supabase
        .from('booking_accommodations')
        .insert(bookingAccs);

      if (accError) {
        logger.error('Error creating booking accommodations:', accError);
      }
    }

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Update booking (only pending bookings)
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { specialRequests, guestInfo } = req.body;

    // Check if booking exists and belongs to user
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingBooking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (existingBooking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending bookings can be updated',
      });
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .update({
        special_requests: specialRequests,
        guest_info: { ...existingBooking.guest_info, ...guestInfo },
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating booking:', error);
      return res.status(500).json({ success: false, message: error.message });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
});

// Cancel booking
router.post('/:id/cancel', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { reason } = req.body;

    // Check if booking exists and belongs to user
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingBooking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (existingBooking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled',
      });
    }

    if (existingBooking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Completed bookings cannot be cancelled',
      });
    }

    // Calculate refund amount based on cancellation policy
    const checkInDate = new Date(existingBooking.check_in_date);
    const now = new Date();
    const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    let refundAmount = 0;
    if (daysUntilCheckIn >= 7) {
      refundAmount = existingBooking.total_price; // Full refund
    } else if (daysUntilCheckIn >= 3) {
      refundAmount = existingBooking.total_price * 0.5; // 50% refund
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        refund_amount: refundAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error cancelling booking:', error);
      return res.status(500).json({ success: false, message: error.message });
    }

    res.json({
      success: true,
      data: booking,
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Check availability
router.post('/check-availability', async (req, res, next) => {
  try {
    const { campsiteId, checkInDate, checkOutDate, guestsCount } = req.body;

    // Validate dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      return res.json({
        success: true,
        data: {
          available: false,
          availableAccommodations: [],
          totalPrice: 0,
          nightsCount: 0,
        },
      });
    }

    // Get all accommodations for campsite
    const { data: accommodations, error: accError } = await supabase
      .from('accommodation_types')
      .select('*')
      .eq('campsite_id', campsiteId);

    if (accError) {
      return res.status(500).json({ success: false, message: accError.message });
    }

    // Get existing bookings for the campsite (excluding cancelled)
    // We'll filter for date overlap manually
    const { data: allBookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id, status, check_in_date, check_out_date')
      .eq('campsite_id', campsiteId)
      .neq('status', 'cancelled');

    if (bookingError) {
      logger.error('Error fetching existing bookings:', bookingError);
      return res.status(500).json({ success: false, message: bookingError.message });
    }

    // Filter bookings that overlap with requested dates
    // Date overlap logic: booking overlaps if (check_in < requested_checkout AND check_out > requested_check_in)
    const existingBookings = (allBookings || []).filter((booking: any) => {
      const bookingCheckIn = new Date(booking.check_in_date);
      const bookingCheckOut = new Date(booking.check_out_date);
      return bookingCheckIn < checkOut && bookingCheckOut > checkIn;
    });

    // Get booking accommodations for overlapping bookings
    const bookingIds = existingBookings?.map((b: any) => b.id) || [];
    let bookedAccommodations: Map<string, number> = new Map();

    if (bookingIds.length > 0) {
      const { data: bookingAccs, error: accBookingError } = await supabase
        .from('booking_accommodations')
        .select('accommodation_type_id, quantity')
        .in('booking_id', bookingIds);

      if (accBookingError) {
        logger.error('Error fetching booking accommodations:', accBookingError);
        return res.status(500).json({ success: false, message: accBookingError.message });
      }

      // Sum up booked quantities by accommodation type
      bookingAccs?.forEach((ba: any) => {
        const current = bookedAccommodations.get(ba.accommodation_type_id) || 0;
        bookedAccommodations.set(ba.accommodation_type_id, current + ba.quantity);
      });
    }

    // Calculate available quantities
    const availableAccommodations = (accommodations || []).map((acc: any) => {
      const bookedQuantity = bookedAccommodations.get(acc.id) || 0;
      const totalQuantity = acc.quantity || 1;
      const availableQuantity = Math.max(0, totalQuantity - bookedQuantity);

      return {
        accommodationTypeId: acc.id,
        name: acc.name,
        availableQuantity,
        pricePerNight: acc.price_per_night || 0,
      };
    }).filter((acc: any) => acc.availableQuantity > 0);

    const totalPrice = availableAccommodations.reduce(
      (sum: number, acc: any) => sum + acc.pricePerNight * acc.availableQuantity,
      0
    ) * nights;

    res.json({
      success: true,
      data: {
        available: availableAccommodations.length > 0,
        availableAccommodations,
        totalPrice,
        nightsCount: nights,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
