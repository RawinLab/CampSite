import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InquiryReplyForm } from '@/components/dashboard/InquiryReplyForm';

// Mock Next.js router
const mockRefresh = jest.fn();
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
    push: mockPush,
  }),
}));

// Mock toast
const mockToast = jest.fn();
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, type = 'button', disabled }: any) => (
    <button onClick={onClick} type={type} disabled={disabled}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: ({ value, onChange, disabled, maxLength, placeholder, rows }: any) => (
    <textarea
      value={value}
      onChange={onChange}
      disabled={disabled}
      maxLength={maxLength}
      placeholder={placeholder}
      rows={rows}
      aria-label="Reply message"
    />
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children, className }: any) => (
    <h3 className={className}>{children}</h3>
  ),
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
}));

// Mock fetch
global.fetch = jest.fn();

describe('InquiryReplyForm', () => {
  const defaultProps = {
    inquiryId: 'inquiry-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  describe('Rendering', () => {
    it('renders the form with textarea', () => {
      render(<InquiryReplyForm {...defaultProps} />);

      expect(screen.getByText('Reply to Inquiry')).toBeInTheDocument();
      expect(screen.getByLabelText('Reply message')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Send Reply/i })).toBeInTheDocument();
    });

    it('renders card structure', () => {
      render(<InquiryReplyForm {...defaultProps} />);

      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('card-header')).toBeInTheDocument();
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
    });

    it('renders textarea with correct placeholder', () => {
      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message');
      expect(textarea).toHaveAttribute('placeholder', 'Write your reply...');
    });

    it('renders textarea with 5 rows', () => {
      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message');
      expect(textarea).toHaveAttribute('rows', '5');
    });

    it('renders character counter initially at 0/2000', () => {
      render(<InquiryReplyForm {...defaultProps} />);

      expect(screen.getByText('0/2000 characters')).toBeInTheDocument();
    });

    it('renders submit button with Send icon', () => {
      render(<InquiryReplyForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /Send Reply/i });
      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('Character Counter', () => {
    it('updates character counter as user types', async () => {
      const user = userEvent.setup();
      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message');

      // Initially 0 characters
      expect(screen.getByText('0/2000 characters')).toBeInTheDocument();

      // Type 24 characters
      await user.type(textarea, 'This is a test reply msg');

      // Should update to 24 characters
      await waitFor(() => {
        expect(screen.getByText('24/2000 characters')).toBeInTheDocument();
      });
    });

    it('shows correct count for longer text', async () => {
      const user = userEvent.setup();
      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message');
      const message = 'This is a longer reply message that should update the character counter correctly';

      await user.type(textarea, message);

      await waitFor(() => {
        expect(screen.getByText(`${message.length}/2000 characters`)).toBeInTheDocument();
      });
    });

    it('respects maxLength of 2000 characters', () => {
      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message');
      expect(textarea).toHaveAttribute('maxLength', '2000');
    });

    it('shows character count at maximum (2000/2000)', async () => {
      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message') as HTMLTextAreaElement;
      const maxMessage = 'a'.repeat(2000);

      // Use fireEvent to set value directly (faster than typing)
      fireEvent.change(textarea, { target: { value: maxMessage } });

      await waitFor(() => {
        expect(screen.getByText('2000/2000 characters')).toBeInTheDocument();
      });
    });
  });

  describe('Validation - Minimum Characters', () => {
    it('disables submit button when reply is empty', () => {
      render(<InquiryReplyForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /Send Reply/i });
      expect(submitButton).toBeDisabled();
    });

    it('disables submit button when reply is less than 10 characters', async () => {
      const user = userEvent.setup();
      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message');
      await user.type(textarea, 'Short');

      const submitButton = screen.getByRole('button', { name: /Send Reply/i });
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when reply is exactly 10 characters', async () => {
      const user = userEvent.setup();
      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message');
      await user.type(textarea, '1234567890'); // Exactly 10 characters

      const submitButton = screen.getByRole('button', { name: /Send Reply/i });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('enables submit button when reply is more than 10 characters', async () => {
      const user = userEvent.setup();
      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message');
      await user.type(textarea, 'This is a valid reply message');

      const submitButton = screen.getByRole('button', { name: /Send Reply/i });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('shows error toast when submitting with less than 10 characters', async () => {
      const user = userEvent.setup();
      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message');
      await user.type(textarea, 'Short msg');

      const submitButton = screen.getByRole('button', { name: /Send Reply/i });

      // Button should be disabled, but let's test the validation logic
      // by directly submitting the form
      const form = textarea.closest('form');
      if (form) {
        fireEvent.submit(form);

        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith({
            title: 'Error',
            description: 'Reply must be at least 10 characters',
            variant: 'destructive',
          });
        });
      }
    });

    it('trims whitespace before validation', async () => {
      const user = userEvent.setup();
      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message');
      // Type 10 characters with leading/trailing spaces
      await user.type(textarea, '   Short   '); // "Short" is only 5 chars when trimmed

      const submitButton = screen.getByRole('button', { name: /Send Reply/i });
      expect(submitButton).toBeDisabled(); // Should be disabled because trimmed length < 10
    });
  });

  describe('Loading State', () => {
    it('shows loading text when submitting', async () => {
      const user = userEvent.setup();

      // Mock a slow response
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
      );

      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message');
      await user.type(textarea, 'This is a valid reply message');

      const submitButton = screen.getByRole('button', { name: /Send Reply/i });
      await user.click(submitButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Sending.../i })).toBeInTheDocument();
      });
    });

    it('disables submit button during submission', async () => {
      const user = userEvent.setup();

      // Mock a slow response
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
      );

      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message');
      await user.type(textarea, 'This is a valid reply message');

      const submitButton = screen.getByRole('button', { name: /Send Reply/i });
      await user.click(submitButton);

      // Button should be disabled while submitting
      await waitFor(() => {
        const loadingButton = screen.getByRole('button', { name: /Sending.../i });
        expect(loadingButton).toBeDisabled();
      });
    });

    it('disables textarea during submission', async () => {
      const user = userEvent.setup();

      // Mock a slow response
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
      );

      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message');
      await user.type(textarea, 'This is a valid reply message');

      const submitButton = screen.getByRole('button', { name: /Send Reply/i });
      await user.click(submitButton);

      // Textarea should be disabled while submitting
      await waitFor(() => {
        expect(textarea).toBeDisabled();
      });
    });

    it('re-enables form after successful submission', async () => {
      const user = userEvent.setup();
      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message');
      await user.type(textarea, 'This is a valid reply message');

      const submitButton = screen.getByRole('button', { name: /Send Reply/i });
      await user.click(submitButton);

      // Wait for submission to complete
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Reply sent',
          description: 'Your reply has been sent to the guest via email',
        });
      });

      // Form should be re-enabled (textarea not disabled, submit button enabled since text is still there)
      await waitFor(() => {
        expect(textarea).not.toBeDisabled();
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits reply with correct API call', async () => {
      const user = userEvent.setup();
      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message');
      const replyMessage = 'Thank you for your inquiry. We have availability for those dates.';
      await user.type(textarea, replyMessage);

      const submitButton = screen.getByRole('button', { name: /Send Reply/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/dashboard/inquiries/inquiry-123/reply',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reply: replyMessage }),
          }
        );
      });
    });

    it('trims whitespace from reply before submission', async () => {
      const user = userEvent.setup();
      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message');
      const replyMessage = '  Thank you for your inquiry.  ';
      await user.type(textarea, replyMessage);

      const submitButton = screen.getByRole('button', { name: /Send Reply/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/dashboard/inquiries/inquiry-123/reply',
          expect.objectContaining({
            body: JSON.stringify({ reply: 'Thank you for your inquiry.' }),
          })
        );
      });
    });

    it('shows success toast on successful submission', async () => {
      const user = userEvent.setup();
      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message');
      await user.type(textarea, 'Thank you for reaching out to us.');

      const submitButton = screen.getByRole('button', { name: /Send Reply/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Reply sent',
          description: 'Your reply has been sent to the guest via email',
        });
      });
    });

    it('refreshes router after successful submission', async () => {
      const user = userEvent.setup();
      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message');
      await user.type(textarea, 'Thank you for your inquiry.');

      const submitButton = screen.getByRole('button', { name: /Send Reply/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error toast when API returns error', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to send reply - database error';

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: errorMessage }),
      });

      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message');
      await user.type(textarea, 'This is a valid reply message');

      const submitButton = screen.getByRole('button', { name: /Send Reply/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      });
    });

    it('shows generic error message when API error has no message', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });

      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message');
      await user.type(textarea, 'This is a valid reply message');

      const submitButton = screen.getByRole('button', { name: /Send Reply/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to send reply',
          variant: 'destructive',
        });
      });
    });

    it('handles network errors gracefully', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message');
      await user.type(textarea, 'This is a valid reply message');

      const submitButton = screen.getByRole('button', { name: /Send Reply/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Network error',
          variant: 'destructive',
        });
      });
    });

    it('handles non-Error exceptions', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockRejectedValue('String error');

      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message');
      await user.type(textarea, 'This is a valid reply message');

      const submitButton = screen.getByRole('button', { name: /Send Reply/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to send reply',
          variant: 'destructive',
        });
      });
    });

    it('re-enables form after error', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'API Error' }),
      });

      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message');
      await user.type(textarea, 'This is a valid reply message');

      const submitButton = screen.getByRole('button', { name: /Send Reply/i });
      await user.click(submitButton);

      // Wait for error to be handled
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: 'destructive',
          })
        );
      });

      // Form should be re-enabled
      await waitFor(() => {
        expect(textarea).not.toBeDisabled();
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('does not refresh router on error', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'API Error' }),
      });

      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message');
      await user.type(textarea, 'This is a valid reply message');

      const submitButton = screen.getByRole('button', { name: /Send Reply/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: 'destructive',
          })
        );
      });

      expect(mockRefresh).not.toHaveBeenCalled();
    });
  });

  describe('Form Interaction', () => {
    it('allows typing in textarea', async () => {
      const user = userEvent.setup();
      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message') as HTMLTextAreaElement;
      await user.type(textarea, 'Test message');

      expect(textarea.value).toBe('Test message');
    });

    it('allows clearing and retyping', async () => {
      const user = userEvent.setup();
      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message') as HTMLTextAreaElement;
      await user.type(textarea, 'First message');
      expect(textarea.value).toBe('First message');

      await user.clear(textarea);
      expect(textarea.value).toBe('');

      await user.type(textarea, 'Second message');
      expect(textarea.value).toBe('Second message');
    });

    it('prevents form submission on Enter key (multiline textarea)', async () => {
      const user = userEvent.setup();
      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message');
      await user.type(textarea, 'Line one{Enter}Line two');

      // Should have newline, not submit
      expect((textarea as HTMLTextAreaElement).value).toContain('\n');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('maintains reply text after validation error', async () => {
      const user = userEvent.setup();
      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message') as HTMLTextAreaElement;
      const shortMessage = 'Short';
      await user.type(textarea, shortMessage);

      // Try to submit (will fail validation)
      const form = textarea.closest('form');
      if (form) {
        fireEvent.submit(form);

        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith(
            expect.objectContaining({
              description: 'Reply must be at least 10 characters',
            })
          );
        });

        // Text should still be in textarea
        expect(textarea.value).toBe(shortMessage);
      }
    });
  });

  describe('Multiple Submissions', () => {
    it('prevents double submission during loading', async () => {
      const user = userEvent.setup();

      // Mock a slow response
      let resolvePromise: any;
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise((resolve) => { resolvePromise = resolve; })
      );

      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message');
      await user.type(textarea, 'This is a valid reply message');

      const submitButton = screen.getByRole('button', { name: /Send Reply/i });

      // Click submit button
      await user.click(submitButton);

      // Try to click again while loading
      await waitFor(() => {
        const loadingButton = screen.getByRole('button', { name: /Sending.../i });
        expect(loadingButton).toBeDisabled();
      });

      const loadingButton = screen.getByRole('button', { name: /Sending.../i });
      await user.click(loadingButton);

      // Should only have been called once
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Resolve the promise
      resolvePromise({ ok: true, json: async () => ({}) });
    });

    it('allows resubmission after error', async () => {
      const user = userEvent.setup();

      // First call fails
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'First error' }),
      });

      render(<InquiryReplyForm {...defaultProps} />);

      const textarea = screen.getByLabelText('Reply message');
      await user.type(textarea, 'This is a valid reply message');

      const submitButton = screen.getByRole('button', { name: /Send Reply/i });
      await user.click(submitButton);

      // Wait for error
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'First error',
          })
        );
      });

      // Now mock success
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      // Click submit again
      await user.click(submitButton);

      // Should succeed this time
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Reply sent',
          description: 'Your reply has been sent to the guest via email',
        });
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Inquiry ID Handling', () => {
    it('uses correct inquiry ID in API endpoint', async () => {
      const user = userEvent.setup();
      const customInquiryId = 'custom-inquiry-456';

      render(<InquiryReplyForm inquiryId={customInquiryId} />);

      const textarea = screen.getByLabelText('Reply message');
      await user.type(textarea, 'Reply to custom inquiry');

      const submitButton = screen.getByRole('button', { name: /Send Reply/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/dashboard/inquiries/${customInquiryId}/reply`,
          expect.any(Object)
        );
      });
    });

    it('handles different inquiry IDs correctly', async () => {
      const user = userEvent.setup();

      const { rerender } = render(<InquiryReplyForm inquiryId="inquiry-1" />);

      const textarea = screen.getByLabelText('Reply message');
      await user.type(textarea, 'Reply to first inquiry');

      const submitButton = screen.getByRole('button', { name: /Send Reply/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/dashboard/inquiries/inquiry-1/reply',
          expect.any(Object)
        );
      });

      // Rerender with different inquiry ID
      rerender(<InquiryReplyForm inquiryId="inquiry-2" />);

      // Clear and type new reply
      await user.clear(textarea);
      await user.type(textarea, 'Reply to second inquiry');
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/dashboard/inquiries/inquiry-2/reply',
          expect.any(Object)
        );
      });
    });
  });
});
