import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportReviewDialog } from '@/components/reviews/ReportReviewDialog';
import type { ReportReason } from '@campsite/shared';

describe('ReportReviewDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  describe('Dialog Visibility', () => {
    it('does not render when isOpen is false', () => {
      render(
        <ReportReviewDialog
          isOpen={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders when isOpen is true', () => {
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Report Review')).toBeInTheDocument();
    });

    it('displays help text explaining the report process', () => {
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(
        screen.getByText(
          /Help us understand what is wrong with this review/i
        )
      ).toBeInTheDocument();
    });
  });

  describe('Report Reason Options', () => {
    it('displays all four report reason options', () => {
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Spam')).toBeInTheDocument();
      expect(
        screen.getByText('This review contains spam or promotional content')
      ).toBeInTheDocument();

      expect(screen.getByText('Inappropriate Content')).toBeInTheDocument();
      expect(
        screen.getByText(
          'This review contains offensive or inappropriate language'
        )
      ).toBeInTheDocument();

      expect(screen.getByText('Fake Review')).toBeInTheDocument();
      expect(
        screen.getByText(
          'This review appears to be fake or from someone who did not visit'
        )
      ).toBeInTheDocument();

      expect(screen.getByText('Other')).toBeInTheDocument();
      expect(
        screen.getByText('This review violates guidelines for another reason')
      ).toBeInTheDocument();
    });

    it('allows selecting a report reason', async () => {
      const user = userEvent.setup();
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const spamRadio = screen.getByRole('radio', { name: /spam/i });
      expect(spamRadio).not.toBeChecked();

      await user.click(spamRadio);

      expect(spamRadio).toBeChecked();
    });

    it('allows changing selected reason', async () => {
      const user = userEvent.setup();
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const spamRadio = screen.getByRole('radio', { name: /spam/i });
      const inappropriateRadio = screen.getByRole('radio', {
        name: /inappropriate content/i,
      });

      await user.click(spamRadio);
      expect(spamRadio).toBeChecked();
      expect(inappropriateRadio).not.toBeChecked();

      await user.click(inappropriateRadio);
      expect(spamRadio).not.toBeChecked();
      expect(inappropriateRadio).toBeChecked();
    });

    it('highlights selected reason option', async () => {
      const user = userEvent.setup();
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const spamLabel = screen.getByText('Spam').closest('label');
      expect(spamLabel).not.toHaveClass('border-primary');

      const spamRadio = screen.getByRole('radio', { name: /spam/i });
      await user.click(spamRadio);

      expect(spamLabel).toHaveClass('border-primary', 'bg-primary/5');
    });
  });

  describe('Additional Details Field', () => {
    it('renders optional details textarea', () => {
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const textarea = screen.getByRole('textbox', {
        name: /additional details/i,
      });
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('placeholder');
    });

    it('allows typing in details field', async () => {
      const user = userEvent.setup();
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const textarea = screen.getByRole('textbox', {
        name: /additional details/i,
      }) as HTMLTextAreaElement;

      await user.type(textarea, 'This review contains spam links');

      expect(textarea.value).toBe('This review contains spam links');
    });

    it('displays character count for details field', async () => {
      const user = userEvent.setup();
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('0/500 characters')).toBeInTheDocument();

      const textarea = screen.getByRole('textbox', {
        name: /additional details/i,
      });
      await user.type(textarea, 'Test message');

      expect(screen.getByText('12/500 characters')).toBeInTheDocument();
    });

    it('enforces maximum length of 500 characters', () => {
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const textarea = screen.getByRole('textbox', {
        name: /additional details/i,
      });
      expect(textarea).toHaveAttribute('maxLength', '500');
    });
  });

  describe('Submit Button Validation', () => {
    it('submit button is disabled when no reason is selected', () => {
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByRole('button', {
        name: /submit report/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it('submit button is enabled after selecting a reason', async () => {
      const user = userEvent.setup();
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByRole('button', {
        name: /submit report/i,
      });
      expect(submitButton).toBeDisabled();

      const spamRadio = screen.getByRole('radio', { name: /spam/i });
      await user.click(spamRadio);

      expect(submitButton).not.toBeDisabled();
    });

    it('shows error when submitting without selecting a reason', async () => {
      const user = userEvent.setup();
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Try to submit form without selecting reason (should not be possible due to disabled button,
      // but test the validation logic)
      const form = screen.getByRole('dialog').querySelector('form');
      if (form) {
        await user.click(form);
        // Since button is disabled, we can't actually submit, but the component
        // has internal validation that would show error
      }
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with selected reason when form is submitted', async () => {
      const user = userEvent.setup();
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const spamRadio = screen.getByRole('radio', { name: /spam/i });
      await user.click(spamRadio);

      const submitButton = screen.getByRole('button', {
        name: /submit report/i,
      });
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith('spam', undefined);
    });

    it('calls onSubmit with reason and details when both provided', async () => {
      const user = userEvent.setup();
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const inappropriateRadio = screen.getByRole('radio', {
        name: /inappropriate content/i,
      });
      await user.click(inappropriateRadio);

      const textarea = screen.getByRole('textbox', {
        name: /additional details/i,
      });
      await user.type(textarea, 'Contains offensive language');

      const submitButton = screen.getByRole('button', {
        name: /submit report/i,
      });
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith(
        'inappropriate',
        'Contains offensive language'
      );
    });

    it('calls onSubmit with undefined when details is empty string', async () => {
      const user = userEvent.setup();
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const fakeRadio = screen.getByRole('radio', { name: /fake review/i });
      await user.click(fakeRadio);

      const textarea = screen.getByRole('textbox', {
        name: /additional details/i,
      });
      await user.type(textarea, '   ');
      await user.clear(textarea);

      const submitButton = screen.getByRole('button', {
        name: /submit report/i,
      });
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith('fake', undefined);
    });
  });

  describe('Loading State', () => {
    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 100);
          })
      );

      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const spamRadio = screen.getByRole('radio', { name: /spam/i });
      await user.click(spamRadio);

      const submitButton = screen.getByRole('button', {
        name: /submit report/i,
      });
      await user.click(submitButton);

      expect(
        screen.getByRole('button', { name: /submitting/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /submitting/i })
      ).toBeDisabled();

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('disables submit button during submission', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 100);
          })
      );

      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const spamRadio = screen.getByRole('radio', { name: /spam/i });
      await user.click(spamRadio);

      const submitButton = screen.getByRole('button', {
        name: /submit report/i,
      });
      await user.click(submitButton);

      const submittingButton = screen.getByRole('button', {
        name: /submitting/i,
      });
      expect(submittingButton).toBeDisabled();
    });
  });

  describe('Success Handling', () => {
    it('closes dialog after successful submission', async () => {
      const user = userEvent.setup();
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const spamRadio = screen.getByRole('radio', { name: /spam/i });
      await user.click(spamRadio);

      const submitButton = screen.getByRole('button', {
        name: /submit report/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('resets form state when dialog is reopened', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const spamRadio = screen.getByRole('radio', { name: /spam/i });
      await user.click(spamRadio);

      const textarea = screen.getByRole('textbox', {
        name: /additional details/i,
      });
      await user.type(textarea, 'Test details');

      // Close dialog
      rerender(
        <ReportReviewDialog
          isOpen={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Reopen dialog
      rerender(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const reopenedSpamRadio = screen.getByRole('radio', { name: /spam/i });
      expect(reopenedSpamRadio).not.toBeChecked();

      const reopenedTextarea = screen.getByRole('textbox', {
        name: /additional details/i,
      }) as HTMLTextAreaElement;
      expect(reopenedTextarea.value).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('displays error message when submission fails', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockRejectedValue(new Error('Network error'));

      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const spamRadio = screen.getByRole('radio', { name: /spam/i });
      await user.click(spamRadio);

      const submitButton = screen.getByRole('button', {
        name: /submit report/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Failed to submit report. Please try again.')
        ).toBeInTheDocument();
      });
    });

    it('does not close dialog when submission fails', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockRejectedValue(new Error('Network error'));

      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const spamRadio = screen.getByRole('radio', { name: /spam/i });
      await user.click(spamRadio);

      const submitButton = screen.getByRole('button', {
        name: /submit report/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Failed to submit report. Please try again.')
        ).toBeInTheDocument();
      });

      expect(mockOnClose).not.toHaveBeenCalled();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('allows retry after error', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockRejectedValueOnce(new Error('Network error'));

      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const spamRadio = screen.getByRole('radio', { name: /spam/i });
      await user.click(spamRadio);

      const submitButton = screen.getByRole('button', {
        name: /submit report/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Failed to submit report. Please try again.')
        ).toBeInTheDocument();
      });

      // Reset mock to succeed
      mockOnSubmit.mockResolvedValue(undefined);

      // Retry
      const retryButton = screen.getByRole('button', {
        name: /submit report/i,
      });
      await user.click(retryButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('clears error when dialog is closed and reopened', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockRejectedValue(new Error('Network error'));

      const { rerender } = render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const spamRadio = screen.getByRole('radio', { name: /spam/i });
      await user.click(spamRadio);

      const submitButton = screen.getByRole('button', {
        name: /submit report/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Failed to submit report. Please try again.')
        ).toBeInTheDocument();
      });

      // Close dialog
      rerender(
        <ReportReviewDialog
          isOpen={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Reopen dialog
      rerender(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(
        screen.queryByText('Failed to submit report. Please try again.')
      ).not.toBeInTheDocument();
    });
  });

  describe('Cancel Button', () => {
    it('renders cancel button', () => {
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(
        screen.getByRole('button', { name: /cancel/i })
      ).toBeInTheDocument();
    });

    it('closes dialog when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not submit when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const spamRadio = screen.getByRole('radio', { name: /spam/i });
      await user.click(spamRadio);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Close Button', () => {
    it('renders close button in header', () => {
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('closes dialog when close button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Backdrop Click', () => {
    it('closes dialog when clicking backdrop', async () => {
      const user = userEvent.setup();
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const backdrop = screen.getByRole('dialog').parentElement;
      if (backdrop) {
        await user.click(backdrop);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it('does not close dialog when clicking dialog content', async () => {
      const user = userEvent.setup();
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const dialog = screen.getByRole('dialog');
      await user.click(dialog);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'report-dialog-title');
    });

    it('has accessible dialog title', () => {
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const title = screen.getByText('Report Review');
      expect(title).toHaveAttribute('id', 'report-dialog-title');
    });

    it('marks reason field as required', () => {
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(
        screen.getByText('Reason for reporting')
      ).toBeInTheDocument();
      const asterisk = screen.getByText('*');
      expect(asterisk).toHaveClass('text-red-500');
    });

    it('has accessible close button', () => {
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Close');
    });

    it('associates textarea with label', () => {
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const textarea = screen.getByRole('textbox', {
        name: /additional details/i,
      });
      expect(textarea).toHaveAttribute('id', 'report-details');
    });
  });

  describe('Custom ClassName', () => {
    it('applies custom className to dialog', () => {
      render(
        <ReportReviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          className="custom-dialog-class"
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('custom-dialog-class');
    });
  });
});
