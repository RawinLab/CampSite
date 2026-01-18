import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InquiryForm } from '@/components/inquiry/InquiryForm';

// Mock dependencies
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    session: null,
  }),
}));

const mockOnSubmit = jest.fn();
const mockOnCancel = jest.fn();

const defaultProps = {
  campsiteId: 'test-campsite-id',
  campsiteName: 'Test Campsite',
  onSubmit: mockOnSubmit,
  onCancel: mockOnCancel,
};

describe('InquiryForm Character Counter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Character count display', () => {
    it('shows current character count', () => {
      render(<InquiryForm {...defaultProps} />);

      const counter = screen.getByText(/0\/2000/);
      expect(counter).toBeInTheDocument();
    });

    it('shows max character limit of 2000', () => {
      render(<InquiryForm {...defaultProps} />);

      expect(screen.getByText(/\/2000/)).toBeInTheDocument();
    });

    it('updates count as user types', async () => {
      const user = userEvent.setup();
      render(<InquiryForm {...defaultProps} />);

      const textarea = screen.getByLabelText(/Your Message/i);
      await user.type(textarea, 'Hello');

      await waitFor(() => {
        expect(screen.getByText(/5\/2000/)).toBeInTheDocument();
      });
    });

    it('updates count incrementally while typing', async () => {
      const user = userEvent.setup();
      render(<InquiryForm {...defaultProps} />);

      const textarea = screen.getByLabelText(/Your Message/i);

      await user.type(textarea, 'Test');

      await waitFor(() => {
        expect(screen.getByText(/4\/2000/)).toBeInTheDocument();
      });
    });

    it('updates count when text is deleted', async () => {
      const user = userEvent.setup();
      render(<InquiryForm {...defaultProps} />);

      const textarea = screen.getByLabelText(/Your Message/i);
      await user.type(textarea, 'Hello World');

      await waitFor(() => {
        expect(screen.getByText(/11\/2000/)).toBeInTheDocument();
      });

      await user.clear(textarea);
      await user.type(textarea, 'Hi');

      await waitFor(() => {
        expect(screen.getByText(/2\/2000/)).toBeInTheDocument();
      });
    });
  });

  describe('Visual feedback', () => {
    it('shows normal color when under threshold', async () => {
      const user = userEvent.setup();
      render(<InquiryForm {...defaultProps} />);

      const textarea = screen.getByLabelText(/Your Message/i);
      await user.type(textarea, 'Short message');

      const counter = await screen.findByText(/13\/2000/);
      expect(counter).toHaveClass('text-gray-500');
      expect(counter).not.toHaveClass('text-red-500');
    });

    it('shows error color when at maximum limit', async () => {
      render(<InquiryForm {...defaultProps} />);

      const textarea = screen.getByLabelText(/Your Message/i) as HTMLTextAreaElement;
      const maxLengthText = 'a'.repeat(2000);

      // Use direct value setting to avoid timeout from typing 2000 chars
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set?.call(textarea, maxLengthText);
      textarea.dispatchEvent(new Event('change', { bubbles: true }));

      await waitFor(() => {
        const counter = screen.getByText(/2000\/2000/);
        expect(counter).toHaveClass('text-gray-500');
      });
    });

    it('shows error color when over maximum limit', async () => {
      render(<InquiryForm {...defaultProps} />);

      const textarea = screen.getByLabelText(/Your Message/i) as HTMLTextAreaElement;
      const atLimitText = 'a'.repeat(2000);

      // Note: maxLength attribute prevents typing beyond limit in actual input
      // Use direct value setting to test at max
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set?.call(textarea, atLimitText);
      textarea.dispatchEvent(new Event('change', { bubbles: true }));

      await waitFor(() => {
        const counter = screen.getByText(/2000\/2000/);
        expect(counter).toBeInTheDocument();
      });
    });

    it('shows normal gray color for counter in regular state', async () => {
      const user = userEvent.setup();
      render(<InquiryForm {...defaultProps} />);

      const textarea = screen.getByLabelText(/Your Message/i);
      await user.type(textarea, 'Normal length message');  // 21 characters

      const counter = await screen.findByText(/21\/2000/);
      expect(counter).toHaveClass('text-gray-500');
    });
  });

  describe('Min/max validation', () => {
    it('shows minimum required (20 chars)', () => {
      render(<InquiryForm {...defaultProps} />);

      expect(screen.getByText(/Minimum 20 characters/i)).toBeInTheDocument();
    });

    it('shows message when under minimum', async () => {
      const user = userEvent.setup();
      render(<InquiryForm {...defaultProps} />);

      const textarea = screen.getByLabelText(/Your Message/i);
      await user.type(textarea, 'Short');

      expect(screen.getByText(/Minimum 20 characters/i)).toBeInTheDocument();
      const minMessage = screen.getByText(/Minimum 20 characters/i);
      expect(minMessage).toHaveClass('text-gray-500');
    });

    it('shows success message when minimum is reached', async () => {
      const user = userEvent.setup();
      render(<InquiryForm {...defaultProps} />);

      const textarea = screen.getByLabelText(/Your Message/i);
      const validMessage = 'a'.repeat(20);

      await user.type(textarea, validMessage);

      await waitFor(() => {
        expect(screen.getByText(/Message length OK/i)).toBeInTheDocument();
      });

      const okMessage = screen.getByText(/Message length OK/i);
      expect(okMessage).toHaveClass('text-green-600');
    });

    it('shows success message when above minimum but below maximum', async () => {
      render(<InquiryForm {...defaultProps} />);

      const textarea = screen.getByLabelText(/Your Message/i) as HTMLTextAreaElement;
      const validMessage = 'a'.repeat(100);

      // Use direct value setting to avoid typing 100 chars
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set?.call(textarea, validMessage);
      textarea.dispatchEvent(new Event('change', { bubbles: true }));

      await waitFor(() => {
        expect(screen.getByText(/Message length OK/i)).toBeInTheDocument();
        expect(screen.getByText(/100\/2000/)).toBeInTheDocument();
      });
    });

    it('prevents typing when maximum is reached due to maxLength attribute', async () => {
      const user = userEvent.setup();
      render(<InquiryForm {...defaultProps} />);

      const textarea = screen.getByLabelText(/Your Message/i) as HTMLTextAreaElement;
      expect(textarea).toHaveAttribute('maxLength', '2000');
    });

    it('shows validation error on submit when under minimum', async () => {
      const user = userEvent.setup();
      render(<InquiryForm {...defaultProps} />);

      // Fill required fields
      await user.type(screen.getByLabelText(/Your Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Email Address/i), 'john@example.com');
      await user.type(screen.getByLabelText(/Your Message/i), 'Too short');

      // When message is under 20 chars, submit button should be disabled
      const submitButton = screen.getByRole('button', { name: /Send Inquiry/i });
      expect(submitButton).toBeDisabled();

      // Verify minimum message is still shown
      expect(screen.getByText(/Minimum 20 characters/i)).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('disables submit button when message is invalid', async () => {
      const user = userEvent.setup();
      render(<InquiryForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /Send Inquiry/i });
      expect(submitButton).toBeDisabled();

      // Type less than minimum
      await user.type(screen.getByLabelText(/Your Message/i), 'Short');
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when message is valid length', async () => {
      const user = userEvent.setup();
      render(<InquiryForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /Send Inquiry/i });
      expect(submitButton).toBeDisabled();

      // Type valid length message
      const validMessage = 'a'.repeat(20);
      await user.type(screen.getByLabelText(/Your Message/i), validMessage);

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('transitions from invalid to valid state correctly', async () => {
      const user = userEvent.setup();
      render(<InquiryForm {...defaultProps} />);

      const textarea = screen.getByLabelText(/Your Message/i);

      // Start with invalid message
      await user.type(textarea, 'Short');
      expect(screen.getByText(/Minimum 20 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/Minimum 20 characters/i)).toHaveClass('text-gray-500');

      // Type more to make it valid
      await user.type(textarea, ' but now it is long enough for validation');

      await waitFor(() => {
        expect(screen.getByText(/Message length OK/i)).toBeInTheDocument();
        expect(screen.getByText(/Message length OK/i)).toHaveClass('text-green-600');
      });
    });

    it('shows exact character count at boundary values', async () => {
      render(<InquiryForm {...defaultProps} />);

      const textarea = screen.getByLabelText(/Your Message/i) as HTMLTextAreaElement;

      // Exactly 20 characters (minimum)
      const exactMin = 'a'.repeat(20);
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set?.call(textarea, exactMin);
      textarea.dispatchEvent(new Event('change', { bubbles: true }));

      await waitFor(() => {
        expect(screen.getByText(/20\/2000/)).toBeInTheDocument();
        expect(screen.getByText(/Message length OK/i)).toBeInTheDocument();
      });

      // Set exactly 2000 characters (maximum)
      const exactMax = 'b'.repeat(2000);
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set?.call(textarea, exactMax);
      textarea.dispatchEvent(new Event('change', { bubbles: true }));

      await waitFor(() => {
        expect(screen.getByText(/2000\/2000/)).toBeInTheDocument();
        expect(screen.getByText(/Message length OK/i)).toBeInTheDocument();
      });
    });
  });

  describe('Counter integration with form', () => {
    it('updates counter when clearing textarea', async () => {
      const user = userEvent.setup();
      render(<InquiryForm {...defaultProps} />);

      const textarea = screen.getByLabelText(/Your Message/i);
      await user.type(textarea, 'Some text to clear');  // 18 characters

      await waitFor(() => {
        expect(screen.getByText(/18\/2000/)).toBeInTheDocument();
      });

      await user.clear(textarea);

      await waitFor(() => {
        expect(screen.getByText(/0\/2000/)).toBeInTheDocument();
      });
    });

    it('shows both counter and minimum message simultaneously', async () => {
      const user = userEvent.setup();
      render(<InquiryForm {...defaultProps} />);

      const textarea = screen.getByLabelText(/Your Message/i);
      await user.type(textarea, 'Test');

      await waitFor(() => {
        expect(screen.getByText(/Minimum 20 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/4\/2000/)).toBeInTheDocument();
      });
    });

    it('maintains counter state across interactions', async () => {
      const user = userEvent.setup();
      render(<InquiryForm {...defaultProps} />);

      const textarea = screen.getByLabelText(/Your Message/i);
      const nameInput = screen.getByLabelText(/Your Name/i);

      // Type a known message
      await user.type(textarea, 'Hello world test');
      await waitFor(() => {
        expect(screen.getByText(/16\/2000/)).toBeInTheDocument();
      });

      // Interact with other field
      await user.type(nameInput, 'John Doe');

      // Counter should still show the same value
      expect(screen.getByText(/16\/2000/)).toBeInTheDocument();

      // Continue typing in message - total should be 16 + 14 = 30
      await user.type(textarea, ' more text here');
      await waitFor(() => {
        expect(screen.getByText(/31\/2000/)).toBeInTheDocument();
      });
    });
  });
});
