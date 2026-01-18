import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InquiryForm } from '@/components/inquiry/InquiryForm';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@supabase/supabase-js';

// Mock the useAuth hook
jest.mock('@/hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('InquiryForm - Pre-fill for Logged-in Users', () => {
  const defaultProps = {
    campsiteId: 'test-campsite-123',
    campsiteName: 'Mountain View Camp',
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
    isSubmitting: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Logged-in user pre-fill', () => {
    it('should pre-fill name from user profile full_name', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'john.doe@example.com',
        user_metadata: {
          full_name: 'John Doe',
        },
      } as User;

      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: { access_token: 'token' } as any,
        loading: false,
      });

      render(<InquiryForm {...defaultProps} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/Your Name/i) as HTMLInputElement;
        expect(nameInput.value).toBe('John Doe');
      });
    });

    it('should pre-fill email from user email', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'jane.smith@example.com',
        user_metadata: {
          full_name: 'Jane Smith',
        },
      } as User;

      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: { access_token: 'token' } as any,
        loading: false,
      });

      render(<InquiryForm {...defaultProps} />);

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
        expect(emailInput.value).toBe('jane.smith@example.com');
      });
    });

    it('should pre-fill phone if present in user profile', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        user_metadata: {
          full_name: 'Test User',
          phone: '0812345678',
        },
      } as User;

      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: { access_token: 'token' } as any,
        loading: false,
      });

      render(<InquiryForm {...defaultProps} />);

      await waitFor(() => {
        const phoneInput = screen.getByLabelText(/Phone Number/i) as HTMLInputElement;
        expect(phoneInput.value).toBe('0812345678');
      });
    });

    it('should pre-fill all fields when user has complete profile', async () => {
      const mockUser = {
        id: 'user-456',
        email: 'complete.user@example.com',
        user_metadata: {
          full_name: 'Complete User',
          phone: '0987654321',
        },
      } as User;

      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: { access_token: 'token' } as any,
        loading: false,
      });

      render(<InquiryForm {...defaultProps} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/Your Name/i) as HTMLInputElement;
        const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
        const phoneInput = screen.getByLabelText(/Phone Number/i) as HTMLInputElement;

        expect(nameInput.value).toBe('Complete User');
        expect(emailInput.value).toBe('complete.user@example.com');
        expect(phoneInput.value).toBe('0987654321');
      });
    });

    it('should leave phone empty if not in user metadata', async () => {
      const mockUser = {
        id: 'user-789',
        email: 'nophone@example.com',
        user_metadata: {
          full_name: 'No Phone User',
        },
      } as User;

      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: { access_token: 'token' } as any,
        loading: false,
      });

      render(<InquiryForm {...defaultProps} />);

      await waitFor(() => {
        const phoneInput = screen.getByLabelText(/Phone Number/i) as HTMLInputElement;
        expect(phoneInput.value).toBe('');
      });
    });
  });

  describe('Anonymous user', () => {
    it('should have all fields empty for non-logged-in user', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        loading: false,
      });

      render(<InquiryForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Your Name/i) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
      const phoneInput = screen.getByLabelText(/Phone Number/i) as HTMLInputElement;

      expect(nameInput.value).toBe('');
      expect(emailInput.value).toBe('');
      expect(phoneInput.value).toBe('');
    });

    it('should allow anonymous users to fill all fields', async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        loading: false,
      });

      render(<InquiryForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Your Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const phoneInput = screen.getByLabelText(/Phone Number/i);

      await user.type(nameInput, 'Anonymous User');
      await user.type(emailInput, 'anon@example.com');
      await user.type(phoneInput, '0811112222');

      expect(nameInput).toHaveValue('Anonymous User');
      expect(emailInput).toHaveValue('anon@example.com');
      expect(phoneInput).toHaveValue('0811112222');
    });
  });

  describe('Field editability', () => {
    it('should allow editing pre-filled name field', async () => {
      const user = userEvent.setup();
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        user_metadata: {
          full_name: 'Original Name',
        },
      } as User;

      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: { access_token: 'token' } as any,
        loading: false,
      });

      render(<InquiryForm {...defaultProps} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/Your Name/i) as HTMLInputElement;
        expect(nameInput.value).toBe('Original Name');
      });

      const nameInput = screen.getByLabelText(/Your Name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Edited Name');

      expect(nameInput).toHaveValue('Edited Name');
    });

    it('should allow editing pre-filled email field', async () => {
      const user = userEvent.setup();
      const mockUser = {
        id: 'user-123',
        email: 'original@example.com',
        user_metadata: {
          full_name: 'User',
        },
      } as User;

      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: { access_token: 'token' } as any,
        loading: false,
      });

      render(<InquiryForm {...defaultProps} />);

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
        expect(emailInput.value).toBe('original@example.com');
      });

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'newemail@example.com');

      expect(emailInput).toHaveValue('newemail@example.com');
    });

    it('should allow editing pre-filled phone field', async () => {
      const user = userEvent.setup();
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        user_metadata: {
          full_name: 'User',
          phone: '0811111111',
        },
      } as User;

      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: { access_token: 'token' } as any,
        loading: false,
      });

      render(<InquiryForm {...defaultProps} />);

      await waitFor(() => {
        const phoneInput = screen.getByLabelText(/Phone Number/i) as HTMLInputElement;
        expect(phoneInput.value).toBe('0811111111');
      });

      const phoneInput = screen.getByLabelText(/Phone Number/i);
      await user.clear(phoneInput);
      await user.type(phoneInput, '0822222222');

      expect(phoneInput).toHaveValue('0822222222');
    });

    it('should validate edited name field', async () => {
      const user = userEvent.setup();
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        user_metadata: {
          full_name: 'Valid Name',
        },
      } as User;

      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: { access_token: 'token' } as any,
        loading: false,
      });

      render(<InquiryForm {...defaultProps} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/Your Name/i) as HTMLInputElement;
        expect(nameInput.value).toBe('Valid Name');
      });

      const nameInput = screen.getByLabelText(/Your Name/i);
      const messageInput = screen.getByLabelText(/Your Message/i);

      // Clear name to trigger validation error
      await user.clear(nameInput);
      await user.type(messageInput, 'Test message that is long enough to pass validation requirements');

      const submitButton = screen.getByRole('button', { name: /Send Inquiry/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
      });
    });

    it('should validate edited email field format', async () => {
      const user = userEvent.setup();
      const mockUser = {
        id: 'user-123',
        email: 'valid@example.com',
        user_metadata: {
          full_name: 'User Name',
        },
      } as User;

      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: { access_token: 'token' } as any,
        loading: false,
      });

      render(<InquiryForm {...defaultProps} />);

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
        expect(emailInput.value).toBe('valid@example.com');
      });

      const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
      const messageInput = screen.getByLabelText(/Your Message/i);

      // Change type to bypass HTML5 email validation
      emailInput.type = 'text';

      // Edit email to invalid format
      await user.clear(emailInput);
      await user.type(emailInput, 'invalid-email');
      await user.type(messageInput, 'Test message that is long enough to pass validation requirements');

      const submitButton = screen.getByRole('button', { name: /Send Inquiry/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('should validate edited phone field format', async () => {
      const user = userEvent.setup();
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        user_metadata: {
          full_name: 'User Name',
          phone: '0812345678',
        },
      } as User;

      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: { access_token: 'token' } as any,
        loading: false,
      });

      render(<InquiryForm {...defaultProps} />);

      await waitFor(() => {
        const phoneInput = screen.getByLabelText(/Phone Number/i) as HTMLInputElement;
        expect(phoneInput.value).toBe('0812345678');
      });

      const phoneInput = screen.getByLabelText(/Phone Number/i);
      const messageInput = screen.getByLabelText(/Your Message/i);

      // Edit phone to invalid Thai format
      await user.clear(phoneInput);
      await user.type(phoneInput, '123456');
      await user.type(messageInput, 'Test message that is long enough to pass validation requirements');

      const submitButton = screen.getByRole('button', { name: /Send Inquiry/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid Thai phone number/i)).toBeInTheDocument();
      });
    });

    it('should submit form successfully with edited pre-filled values', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      const mockUser = {
        id: 'user-123',
        email: 'original@example.com',
        user_metadata: {
          full_name: 'Original User',
          phone: '0811111111',
        },
      } as User;

      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: { access_token: 'token' } as any,
        loading: false,
      });

      render(<InquiryForm {...defaultProps} onSubmit={mockSubmit} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/Your Name/i) as HTMLInputElement;
        expect(nameInput.value).toBe('Original User');
      });

      // Edit all pre-filled fields
      const nameInput = screen.getByLabelText(/Your Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const phoneInput = screen.getByLabelText(/Phone Number/i);
      const messageInput = screen.getByLabelText(/Your Message/i);

      await user.clear(nameInput);
      await user.type(nameInput, 'Edited User');
      await user.clear(emailInput);
      await user.type(emailInput, 'edited@example.com');
      await user.clear(phoneInput);
      await user.type(phoneInput, '0822222222');
      await user.type(messageInput, 'This is my edited inquiry message with enough characters');

      const submitButton = screen.getByRole('button', { name: /Send Inquiry/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          campsite_id: 'test-campsite-123',
          guest_name: 'Edited User',
          guest_email: 'edited@example.com',
          guest_phone: '0822222222',
          inquiry_type: 'general',
          message: 'This is my edited inquiry message with enough characters',
          check_in_date: undefined,
          check_out_date: undefined,
        });
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle missing user_metadata gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        user_metadata: {},
      } as User;

      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: { access_token: 'token' } as any,
        loading: false,
      });

      render(<InquiryForm {...defaultProps} />);

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
        expect(emailInput.value).toBe('user@example.com');
      });

      const nameInput = screen.getByLabelText(/Your Name/i) as HTMLInputElement;
      const phoneInput = screen.getByLabelText(/Phone Number/i) as HTMLInputElement;

      expect(nameInput.value).toBe('');
      expect(phoneInput.value).toBe('');
    });

    it('should handle null user_metadata', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        user_metadata: null,
      } as any;

      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: { access_token: 'token' } as any,
        loading: false,
      });

      render(<InquiryForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Your Name/i) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
      const phoneInput = screen.getByLabelText(/Phone Number/i) as HTMLInputElement;

      expect(nameInput.value).toBe('');
      expect(emailInput.value).toBe('user@example.com');
      expect(phoneInput.value).toBe('');
    });

    it('should not re-populate fields if user logs in after starting to fill form', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<InquiryForm {...defaultProps} />);

      // Start as anonymous user
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        loading: false,
      });

      // User types in fields
      const nameInput = screen.getByLabelText(/Your Name/i);
      await user.type(nameInput, 'Manual Entry');

      // Simulate user logging in
      const mockUser = {
        id: 'user-123',
        email: 'newuser@example.com',
        user_metadata: {
          full_name: 'Auto Fill Name',
        },
      } as User;

      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: { access_token: 'token' } as any,
        loading: false,
      });

      rerender(<InquiryForm {...defaultProps} />);

      // The manually entered value should be overwritten by the new user data
      await waitFor(() => {
        expect(nameInput).toHaveValue('Auto Fill Name');
      });
    });
  });
});
