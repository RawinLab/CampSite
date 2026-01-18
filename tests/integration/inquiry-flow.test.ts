import request from 'supertest';
import app from '../../apps/campsite-backend/src/app';
import { supabaseAdmin } from '../../apps/campsite-backend/src/lib/supabase';
import * as emailService from '../../apps/campsite-backend/src/services/emailService';

/**
 * Integration Tests: Full Inquiry Flow (T045)
 * Tests complete inquiry submission and notification flow
 *
 * Tests cover:
 * 1. Full inquiry submission flow:
 *    - User submits inquiry via API
 *    - Inquiry saved to database
 *    - Owner notification email triggered
 *    - User confirmation email triggered
 *    - Response contains inquiry ID
 * 2. Data persistence:
 *    - Inquiry can be retrieved after creation
 *    - All fields stored correctly
 *    - Timestamps set correctly
 * 3. Error scenarios:
 *    - Invalid campsite ID fails appropriately
 *    - Database error handled gracefully
 */

// Mock email service to avoid sending real emails
jest.mock('../../apps/campsite-backend/src/services/emailService', () => ({
  sendInquiryNotification: jest.fn().mockResolvedValue({ success: true, messageId: 'mock-notification' }),
  sendInquiryConfirmation: jest.fn().mockResolvedValue({ success: true, messageId: 'mock-confirmation' }),
  sendInquiryReplyNotification: jest.fn().mockResolvedValue({ success: true, messageId: 'mock-reply' }),
}));

describe('Integration: Full Inquiry Flow - POST /api/inquiries', () => {
  let ownerUserId: string;
  let regularUserId: string;
  let regularUserToken: string;
  let campsiteId: string;
  let ownerEmail: string;

  beforeAll(async () => {
    // Create owner user
    const { data: ownerAuthData, error: ownerSignUpError } = await supabaseAdmin.auth.admin.createUser({
      email: `owner-inquiry-${Date.now()}@example.com`,
      password: 'ownerPassword123!',
      email_confirm: true,
    });

    if (ownerSignUpError || !ownerAuthData.user) {
      throw new Error('Failed to create owner user');
    }

    ownerUserId = ownerAuthData.user.id;
    ownerEmail = ownerAuthData.user.email!;

    // Update owner profile with role and full name
    await supabaseAdmin
      .from('profiles')
      .update({
        user_role: 'owner',
        full_name: 'Test Owner'
      })
      .eq('id', ownerUserId);

    // Create regular user
    const { data: regularAuthData, error: regularSignUpError } = await supabaseAdmin.auth.admin.createUser({
      email: `user-inquiry-${Date.now()}@example.com`,
      password: 'userPassword123!',
      email_confirm: true,
    });

    if (regularSignUpError || !regularAuthData.user) {
      throw new Error('Failed to create regular user');
    }

    regularUserId = regularAuthData.user.id;

    // Update regular user profile with full name
    await supabaseAdmin
      .from('profiles')
      .update({
        full_name: 'Test User'
      })
      .eq('id', regularUserId);

    // Sign in regular user to get access token
    const { data: signInData } = await supabaseAdmin.auth.signInWithPassword({
      email: regularAuthData.user.email!,
      password: 'userPassword123!',
    });

    if (signInData.session) {
      regularUserToken = signInData.session.access_token;
    }

    // Create test campsite (approved)
    const { data: campsite, error: campsiteError } = await supabaseAdmin
      .from('campsites')
      .insert({
        owner_id: ownerUserId,
        name: `Inquiry Test Campsite ${Date.now()}`,
        description: 'A test campsite for inquiry flow testing',
        slug: `inquiry-test-campsite-${Date.now()}`,
        campsite_type: 'camping',
        province_id: 1,
        status: 'approved',
        min_price: 500,
        max_price: 1500,
        latitude: 13.7563,
        longitude: 100.5018,
      })
      .select()
      .single();

    if (campsiteError || !campsite) {
      throw new Error('Failed to create test campsite');
    }

    campsiteId = campsite.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (campsiteId) {
      await supabaseAdmin.from('inquiries').delete().eq('campsite_id', campsiteId);
      await supabaseAdmin.from('campsites').delete().eq('id', campsiteId);
    }
    if (ownerUserId) {
      await supabaseAdmin.auth.admin.deleteUser(ownerUserId);
    }
    if (regularUserId) {
      await supabaseAdmin.auth.admin.deleteUser(regularUserId);
    }
  });

  beforeEach(() => {
    // Clear mock calls before each test
    jest.clearAllMocks();
  });

  describe('T045.1: Full inquiry submission flow', () => {
    it('should complete full flow: API → Database → Email notifications', async () => {
      const inquiryData = {
        campsite_id: campsiteId,
        guest_name: 'John Doe',
        guest_email: 'john.doe@example.com',
        guest_phone: '+66812345678',
        inquiry_type: 'booking',
        subject: 'Weekend camping inquiry',
        message: 'I would like to book a campsite for this weekend. Do you have availability?',
        check_in_date: '2026-02-01',
        check_out_date: '2026-02-03',
        guest_count: 4,
      };

      // Submit inquiry
      const response = await request(app)
        .post('/api/inquiries')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(inquiryData)
        .expect(201);

      // Verify API response
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Inquiry sent successfully. The owner will be notified.');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();

      const inquiryId = response.body.data.id;

      // Verify inquiry saved to database
      const { data: savedInquiry, error: fetchError } = await supabaseAdmin
        .from('inquiries')
        .select('*')
        .eq('id', inquiryId)
        .single();

      expect(fetchError).toBeNull();
      expect(savedInquiry).toBeDefined();
      expect(savedInquiry.campsite_id).toBe(campsiteId);
      expect(savedInquiry.user_id).toBe(regularUserId);
      expect(savedInquiry.guest_name).toBe(inquiryData.guest_name);
      expect(savedInquiry.guest_email).toBe(inquiryData.guest_email);
      expect(savedInquiry.guest_phone).toBe(inquiryData.guest_phone);
      expect(savedInquiry.inquiry_type).toBe(inquiryData.inquiry_type);
      expect(savedInquiry.subject).toBe(inquiryData.subject);
      expect(savedInquiry.message).toBe(inquiryData.message);
      expect(savedInquiry.check_in_date).toBe(inquiryData.check_in_date);
      expect(savedInquiry.check_out_date).toBe(inquiryData.check_out_date);
      expect(savedInquiry.guest_count).toBe(inquiryData.guest_count);
      expect(savedInquiry.status).toBe('new');

      // Verify owner notification email triggered
      expect(emailService.sendInquiryNotification).toHaveBeenCalledTimes(1);
      expect(emailService.sendInquiryNotification).toHaveBeenCalledWith(
        ownerEmail,
        expect.objectContaining({
          ownerName: 'Test Owner',
          campsiteName: expect.stringContaining('Inquiry Test Campsite'),
          guestName: inquiryData.guest_name,
          guestEmail: inquiryData.guest_email,
          guestPhone: inquiryData.guest_phone,
          inquiryType: inquiryData.inquiry_type,
          message: inquiryData.message,
          checkInDate: inquiryData.check_in_date,
          checkOutDate: inquiryData.check_out_date,
          inquiryId,
        })
      );

      // Verify user confirmation email triggered
      expect(emailService.sendInquiryConfirmation).toHaveBeenCalledTimes(1);
      expect(emailService.sendInquiryConfirmation).toHaveBeenCalledWith(
        inquiryData.guest_email,
        expect.objectContaining({
          guestName: inquiryData.guest_name,
          campsiteName: expect.stringContaining('Inquiry Test Campsite'),
          message: inquiryData.message,
          checkInDate: inquiryData.check_in_date,
          checkOutDate: inquiryData.check_out_date,
        })
      );
    });

    it('should handle inquiry with minimal required fields', async () => {
      const inquiryData = {
        campsite_id: campsiteId,
        guest_name: 'Jane Smith',
        guest_email: 'jane.smith@example.com',
        message: 'What are your check-in and check-out times?',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(inquiryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();

      const inquiryId = response.body.data.id;

      // Verify inquiry saved to database
      const { data: savedInquiry } = await supabaseAdmin
        .from('inquiries')
        .select('*')
        .eq('id', inquiryId)
        .single();

      expect(savedInquiry).toBeDefined();
      expect(savedInquiry.guest_name).toBe(inquiryData.guest_name);
      expect(savedInquiry.guest_email).toBe(inquiryData.guest_email);
      expect(savedInquiry.message).toBe(inquiryData.message);
      expect(savedInquiry.inquiry_type).toBe('general'); // default value
      expect(savedInquiry.guest_phone).toBeNull();
      expect(savedInquiry.subject).toBeNull();

      // Verify emails sent
      expect(emailService.sendInquiryNotification).toHaveBeenCalled();
      expect(emailService.sendInquiryConfirmation).toHaveBeenCalled();
    });

    it('should allow guest (non-authenticated) to submit inquiry', async () => {
      const inquiryData = {
        campsite_id: campsiteId,
        guest_name: 'Anonymous Guest',
        guest_email: 'guest@example.com',
        message: 'Can I bring my pet?',
        inquiry_type: 'general',
      };

      // Submit without auth token
      const response = await request(app)
        .post('/api/inquiries')
        .send(inquiryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();

      const inquiryId = response.body.data.id;

      // Verify inquiry saved with null user_id
      const { data: savedInquiry } = await supabaseAdmin
        .from('inquiries')
        .select('*')
        .eq('id', inquiryId)
        .single();

      expect(savedInquiry).toBeDefined();
      expect(savedInquiry.user_id).toBeNull(); // Guest inquiry
      expect(savedInquiry.guest_name).toBe(inquiryData.guest_name);
      expect(savedInquiry.guest_email).toBe(inquiryData.guest_email);
    });
  });

  describe('T045.2: Data persistence and retrieval', () => {
    it('should retrieve inquiry after creation with all fields intact', async () => {
      const inquiryData = {
        campsite_id: campsiteId,
        guest_name: 'Bob Johnson',
        guest_email: 'bob.johnson@example.com',
        guest_phone: '+66823456789',
        inquiry_type: 'availability',
        subject: 'Group booking inquiry',
        message: 'Do you accept group bookings for 10 people?',
        check_in_date: '2026-03-15',
        check_out_date: '2026-03-17',
        guest_count: 10,
      };

      // Create inquiry
      const createResponse = await request(app)
        .post('/api/inquiries')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(inquiryData)
        .expect(201);

      const inquiryId = createResponse.body.data.id;

      // Retrieve inquiry directly from database
      const { data: retrievedInquiry, error } = await supabaseAdmin
        .from('inquiries')
        .select('*')
        .eq('id', inquiryId)
        .single();

      expect(error).toBeNull();
      expect(retrievedInquiry).toBeDefined();

      // Verify all fields
      expect(retrievedInquiry.id).toBe(inquiryId);
      expect(retrievedInquiry.campsite_id).toBe(campsiteId);
      expect(retrievedInquiry.user_id).toBe(regularUserId);
      expect(retrievedInquiry.guest_name).toBe(inquiryData.guest_name);
      expect(retrievedInquiry.guest_email).toBe(inquiryData.guest_email);
      expect(retrievedInquiry.guest_phone).toBe(inquiryData.guest_phone);
      expect(retrievedInquiry.inquiry_type).toBe(inquiryData.inquiry_type);
      expect(retrievedInquiry.subject).toBe(inquiryData.subject);
      expect(retrievedInquiry.message).toBe(inquiryData.message);
      expect(retrievedInquiry.check_in_date).toBe(inquiryData.check_in_date);
      expect(retrievedInquiry.check_out_date).toBe(inquiryData.check_out_date);
      expect(retrievedInquiry.guest_count).toBe(inquiryData.guest_count);
      expect(retrievedInquiry.status).toBe('new');
      expect(retrievedInquiry.read_at).toBeNull();
      expect(retrievedInquiry.replied_at).toBeNull();
      expect(retrievedInquiry.owner_reply).toBeNull();
    });

    it('should set timestamps correctly', async () => {
      const beforeSubmit = new Date();

      const inquiryData = {
        campsite_id: campsiteId,
        guest_name: 'Timestamp Test',
        guest_email: 'timestamp@example.com',
        message: 'Testing timestamp creation',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(inquiryData)
        .expect(201);

      const afterSubmit = new Date();
      const inquiryId = response.body.data.id;

      // Retrieve inquiry
      const { data: inquiry } = await supabaseAdmin
        .from('inquiries')
        .select('*')
        .eq('id', inquiryId)
        .single();

      expect(inquiry).toBeDefined();
      expect(inquiry.created_at).toBeDefined();
      expect(inquiry.updated_at).toBeDefined();

      // Verify created_at is within reasonable time range
      const createdAt = new Date(inquiry.created_at);
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeSubmit.getTime() - 5000);
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterSubmit.getTime() + 5000);

      // Verify updated_at matches created_at initially
      expect(inquiry.updated_at).toBe(inquiry.created_at);
    });

    it('should track analytics event on inquiry creation', async () => {
      const inquiryData = {
        campsite_id: campsiteId,
        guest_name: 'Analytics Test',
        guest_email: 'analytics@example.com',
        message: 'Testing analytics tracking',
        inquiry_type: 'pricing',
        check_in_date: '2026-04-01',
        check_out_date: '2026-04-05',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(inquiryData)
        .expect(201);

      expect(response.body.success).toBe(true);

      // Wait a bit for analytics event to be recorded
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify analytics event was created
      const { data: analyticsEvents } = await supabaseAdmin
        .from('analytics_events')
        .select('*')
        .eq('campsite_id', campsiteId)
        .eq('user_id', regularUserId)
        .eq('event_type', 'inquiry_sent')
        .order('created_at', { ascending: false })
        .limit(1);

      expect(analyticsEvents).toBeDefined();
      expect(analyticsEvents!.length).toBeGreaterThan(0);

      const event = analyticsEvents![0];
      expect(event.metadata).toBeDefined();
      expect(event.metadata.inquiry_type).toBe('pricing');
      expect(event.metadata.has_dates).toBe(true);
    });
  });

  describe('T045.3: Error scenarios', () => {
    it('should fail with invalid campsite ID', async () => {
      const inquiryData = {
        campsite_id: '00000000-0000-0000-0000-000000000000',
        guest_name: 'Error Test',
        guest_email: 'error@example.com',
        message: 'This should fail',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(inquiryData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Campsite not found');

      // Verify no emails were sent
      expect(emailService.sendInquiryNotification).not.toHaveBeenCalled();
      expect(emailService.sendInquiryConfirmation).not.toHaveBeenCalled();
    });

    it('should fail with non-existent campsite ID format error', async () => {
      const inquiryData = {
        campsite_id: 'invalid-uuid-format',
        guest_name: 'Format Error Test',
        guest_email: 'format-error@example.com',
        message: 'This should fail with format error',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(inquiryData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should validate required fields', async () => {
      // Missing guest_name
      const missingName = {
        campsite_id: campsiteId,
        guest_email: 'missing-name@example.com',
        message: 'Missing guest name',
      };

      let response = await request(app)
        .post('/api/inquiries')
        .send(missingName)
        .expect(400);

      expect(response.body.error).toBeDefined();

      // Missing guest_email
      const missingEmail = {
        campsite_id: campsiteId,
        guest_name: 'No Email',
        message: 'Missing guest email',
      };

      response = await request(app)
        .post('/api/inquiries')
        .send(missingEmail)
        .expect(400);

      expect(response.body.error).toBeDefined();

      // Missing message
      const missingMessage = {
        campsite_id: campsiteId,
        guest_name: 'No Message',
        guest_email: 'no-message@example.com',
      };

      response = await request(app)
        .post('/api/inquiries')
        .send(missingMessage)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should validate email format', async () => {
      const invalidEmail = {
        campsite_id: campsiteId,
        guest_name: 'Invalid Email',
        guest_email: 'not-an-email',
        message: 'This has an invalid email format',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(invalidEmail)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should validate message length', async () => {
      // Message too short (if schema enforces minimum)
      const tooShort = {
        campsite_id: campsiteId,
        guest_name: 'Short Message',
        guest_email: 'short@example.com',
        message: 'Hi',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(tooShort)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should handle email service failure gracefully', async () => {
      // Mock email service to fail
      (emailService.sendInquiryNotification as jest.Mock).mockRejectedValueOnce(
        new Error('Email service unavailable')
      );
      (emailService.sendInquiryConfirmation as jest.Mock).mockRejectedValueOnce(
        new Error('Email service unavailable')
      );

      const inquiryData = {
        campsite_id: campsiteId,
        guest_name: 'Email Failure Test',
        guest_email: 'email-failure@example.com',
        message: 'Testing email failure handling',
      };

      // Inquiry should still be created even if emails fail
      const response = await request(app)
        .post('/api/inquiries')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(inquiryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();

      // Verify inquiry was saved despite email failure
      const { data: savedInquiry } = await supabaseAdmin
        .from('inquiries')
        .select('*')
        .eq('id', response.body.data.id)
        .single();

      expect(savedInquiry).toBeDefined();
      expect(savedInquiry.guest_name).toBe(inquiryData.guest_name);
    });
  });

  describe('T045.4: Rate limiting integration', () => {
    it('should include rate limit info in response', async () => {
      const inquiryData = {
        campsite_id: campsiteId,
        guest_name: 'Rate Limit Test',
        guest_email: 'ratelimit@example.com',
        message: 'Testing rate limit response',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(inquiryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.rateLimitInfo).toBeDefined();
      expect(response.body.rateLimitInfo.limit).toBeDefined();
      expect(response.body.rateLimitInfo.remaining).toBeDefined();
    });
  });

  describe('T045.5: Edge cases', () => {
    it('should handle special characters in message', async () => {
      const inquiryData = {
        campsite_id: campsiteId,
        guest_name: 'Special Chars Test',
        guest_email: 'special@example.com',
        message: 'Testing special characters: <script>alert("XSS")</script> & "quotes" \'apostrophes\' 日本語',
      };

      const response = await request(app)
        .post('/api/inquiries')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(inquiryData)
        .expect(201);

      expect(response.body.success).toBe(true);

      const { data: savedInquiry } = await supabaseAdmin
        .from('inquiries')
        .select('*')
        .eq('id', response.body.data.id)
        .single();

      // Message should be saved as-is (sanitization happens on display, not storage)
      expect(savedInquiry.message).toBe(inquiryData.message);
    });

    it('should handle future dates for check-in/check-out', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const checkIn = futureDate.toISOString().split('T')[0];
      futureDate.setDate(futureDate.getDate() + 3);
      const checkOut = futureDate.toISOString().split('T')[0];

      const inquiryData = {
        campsite_id: campsiteId,
        guest_name: 'Future Dates Test',
        guest_email: 'future@example.com',
        message: 'Booking for next year',
        check_in_date: checkIn,
        check_out_date: checkOut,
      };

      const response = await request(app)
        .post('/api/inquiries')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(inquiryData)
        .expect(201);

      expect(response.body.success).toBe(true);

      const { data: savedInquiry } = await supabaseAdmin
        .from('inquiries')
        .select('*')
        .eq('id', response.body.data.id)
        .single();

      expect(savedInquiry.check_in_date).toBe(checkIn);
      expect(savedInquiry.check_out_date).toBe(checkOut);
    });

    it('should handle large guest count', async () => {
      const inquiryData = {
        campsite_id: campsiteId,
        guest_name: 'Large Group Test',
        guest_email: 'largegroup@example.com',
        message: 'Can you accommodate a large group?',
        guest_count: 100,
      };

      const response = await request(app)
        .post('/api/inquiries')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(inquiryData)
        .expect(201);

      expect(response.body.success).toBe(true);

      const { data: savedInquiry } = await supabaseAdmin
        .from('inquiries')
        .select('*')
        .eq('id', response.body.data.id)
        .single();

      expect(savedInquiry.guest_count).toBe(100);
    });
  });
});
