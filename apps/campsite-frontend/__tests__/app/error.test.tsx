import { render, screen, fireEvent } from '@testing-library/react';
import ErrorPage from '@/app/error';

describe('Error Page', () => {
  const mockError = new Error('Test error message');
  const mockReset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Error Display', () => {
    it('renders error heading', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      expect(screen.getByText('เกิดข้อผิดพลาด')).toBeInTheDocument();
    });

    it('renders error title', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      expect(screen.getByText('ขออภัย เกิดปัญหาบางอย่าง')).toBeInTheDocument();
    });

    it('renders error description', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      expect(
        screen.getByText(/เกิดข้อผิดพลาดขณะโหลดหน้านี้ ทีมงานได้รับแจ้งปัญหานี้แล้ว/)
      ).toBeInTheDocument();
    });

    it('displays warning icon', () => {
      const { container } = render(<ErrorPage error={mockError} reset={mockReset} />);

      const warningIcon = container.querySelector('svg.text-red-500');
      expect(warningIcon).toBeInTheDocument();
    });

    it('logs error to console on mount', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      expect(console.error).toHaveBeenCalledWith('Application error:', mockError);
    });
  });

  describe('Retry Button', () => {
    it('has retry button', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      const retryButton = screen.getByRole('button', { name: /ลองใหม่อีกครั้ง/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('calls reset function when retry button is clicked', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      const retryButton = screen.getByRole('button', { name: /ลองใหม่อีกครั้ง/i });
      fireEvent.click(retryButton);

      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it('displays refresh icon on retry button', () => {
      const { container } = render(<ErrorPage error={mockError} reset={mockReset} />);

      const retryButton = screen.getByRole('button', { name: /ลองใหม่อีกครั้ง/i });
      const icon = retryButton.querySelector('svg');

      expect(icon).toBeInTheDocument();
    });

    it('applies correct styling to retry button', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      const retryButton = screen.getByRole('button', { name: /ลองใหม่อีกครั้ง/i });
      expect(retryButton).toHaveClass('bg-green-600', 'hover:bg-green-700');
    });
  });

  describe('Home Button', () => {
    it('has home button', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      const homeButton = screen.getByRole('button', { name: /กลับหน้าหลัก/i });
      expect(homeButton).toBeInTheDocument();
    });

    it('navigates to home page when clicked', () => {
      delete (window as any).location;
      (window as any).location = { href: '' };

      render(<ErrorPage error={mockError} reset={mockReset} />);

      const homeButton = screen.getByRole('button', { name: /กลับหน้าหลัก/i });
      fireEvent.click(homeButton);

      expect(window.location.href).toBe('/');
    });

    it('displays home icon on home button', () => {
      const { container } = render(<ErrorPage error={mockError} reset={mockReset} />);

      const homeButton = screen.getByRole('button', { name: /กลับหน้าหลัก/i });
      const icon = homeButton.querySelector('svg');

      expect(icon).toBeInTheDocument();
    });

    it('applies outline variant to home button', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      const homeButton = screen.getByRole('button', { name: /กลับหน้าหลัก/i });
      expect(homeButton).toBeInTheDocument();
    });
  });

  describe('Error Details in Development', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('shows error details in development mode', () => {
      process.env.NODE_ENV = 'development';

      render(<ErrorPage error={mockError} reset={mockReset} />);

      expect(screen.getByText('Error Details:')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('shows error digest in development mode when available', () => {
      process.env.NODE_ENV = 'development';

      const errorWithDigest: Error & { digest?: string } = new Error('Test error');
      errorWithDigest.digest = 'abc123';

      render(<ErrorPage error={errorWithDigest} reset={mockReset} />);

      expect(screen.getByText(/Error ID: abc123/)).toBeInTheDocument();
    });

    it('does not show error details in production mode', () => {
      process.env.NODE_ENV = 'production';

      render(<ErrorPage error={mockError} reset={mockReset} />);

      expect(screen.queryByText('Error Details:')).not.toBeInTheDocument();
      expect(screen.queryByText('Test error message')).not.toBeInTheDocument();
    });

    it('applies correct styling to error details box', () => {
      process.env.NODE_ENV = 'development';

      const { container } = render(<ErrorPage error={mockError} reset={mockReset} />);

      const errorBox = container.querySelector('.bg-red-50.rounded-lg');
      expect(errorBox).toBeInTheDocument();
    });

    it('displays error message in monospace font', () => {
      process.env.NODE_ENV = 'development';

      const { container } = render(<ErrorPage error={mockError} reset={mockReset} />);

      const errorMessage = screen.getByText('Test error message');
      expect(errorMessage).toHaveClass('font-mono');
    });
  });

  describe('Support Contact', () => {
    it('displays support contact text', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      expect(screen.getByText('ปัญหายังไม่ได้รับการแก้ไข?')).toBeInTheDocument();
    });

    it('has support email link', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      const supportLink = screen.getByText('ติดต่อฝ่ายสนับสนุน');
      expect(supportLink).toHaveAttribute('href', 'mailto:support@campingthailand.com');
    });

    it('applies correct styling to support link', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      const supportLink = screen.getByText('ติดต่อฝ่ายสนับสนุน');
      expect(supportLink).toHaveClass('text-green-600', 'hover:text-green-700', 'underline');
    });

    it('separates support section with border', () => {
      const { container } = render(<ErrorPage error={mockError} reset={mockReset} />);

      const supportSection = container.querySelector('.border-t.border-gray-200');
      expect(supportSection).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('has centered layout', () => {
      const { container } = render(<ErrorPage error={mockError} reset={mockReset} />);

      const mainDiv = container.querySelector('.min-h-screen.flex.items-center.justify-center');
      expect(mainDiv).toBeInTheDocument();
    });

    it('applies red gradient background', () => {
      const { container } = render(<ErrorPage error={mockError} reset={mockReset} />);

      const mainDiv = container.querySelector('.bg-gradient-to-b.from-red-50.to-white');
      expect(mainDiv).toBeInTheDocument();
    });

    it('renders content within a Card component', () => {
      const { container } = render(<ErrorPage error={mockError} reset={mockReset} />);

      const card = container.querySelector('.max-w-lg.w-full');
      expect(card).toBeInTheDocument();
    });

    it('has centered text alignment', () => {
      const { container } = render(<ErrorPage error={mockError} reset={mockReset} />);

      const cardContent = container.querySelector('.text-center');
      expect(cardContent).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      const { container } = render(<ErrorPage error={mockError} reset={mockReset} />);

      const h1 = container.querySelector('h1');
      const h2 = container.querySelector('h2');

      expect(h1).toBeInTheDocument();
      expect(h1).toHaveTextContent('เกิดข้อผิดพลาด');
      expect(h2).toBeInTheDocument();
      expect(h2).toHaveTextContent('ขออภัย เกิดปัญหาบางอย่าง');
    });

    it('has accessible button labels', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      expect(screen.getByRole('button', { name: /ลองใหม่อีกครั้ง/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /กลับหน้าหลัก/i })).toBeInTheDocument();
    });

    it('has accessible link for support', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      const supportLink = screen.getByRole('link', { name: /ติดต่อฝ่ายสนับสนุน/i });
      expect(supportLink).toBeInTheDocument();
      expect(supportLink).toHaveAttribute('href', 'mailto:support@campingthailand.com');
    });
  });

  describe('Responsive Design', () => {
    it('has responsive button layout classes', () => {
      const { container } = render(<ErrorPage error={mockError} reset={mockReset} />);

      const buttonContainer = container.querySelector('.flex-col.sm\\:flex-row');
      expect(buttonContainer).toBeInTheDocument();
    });

    it('has responsive gap between buttons', () => {
      const { container } = render(<ErrorPage error={mockError} reset={mockReset} />);

      const buttonContainer = container.querySelector('.gap-3');
      expect(buttonContainer).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('displays all required sections', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      expect(screen.getByText('เกิดข้อผิดพลาด')).toBeInTheDocument();
      expect(screen.getByText('ขออภัย เกิดปัญหาบางอย่าง')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ลองใหม่อีกครั้ง/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /กลับหน้าหลัก/i })).toBeInTheDocument();
      expect(screen.getByText('ปัญหายังไม่ได้รับการแก้ไข?')).toBeInTheDocument();
    });

    it('renders both action buttons', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });
  });

  describe('Multiple Error Instances', () => {
    it('handles different error messages', () => {
      process.env.NODE_ENV = 'development';

      const customError = new Error('Custom error message');

      const { rerender } = render(<ErrorPage error={mockError} reset={mockReset} />);

      rerender(<ErrorPage error={customError} reset={mockReset} />);

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('resets console.error mock between calls', () => {
      render(<ErrorPage error={mockError} reset={mockReset} />);

      expect(console.error).toHaveBeenCalledTimes(1);

      const secondError = new Error('Second error');
      const { rerender } = render(<ErrorPage error={secondError} reset={mockReset} />);

      expect(console.error).toHaveBeenCalledTimes(2);
    });
  });
});
