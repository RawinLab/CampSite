import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary, CompactErrorBoundary } from '@/components/ErrorBoundary';
import { logError } from '@/lib/error-logging';

// Mock the error logging utility
jest.mock('@/lib/error-logging', () => ({
  logError: jest.fn(),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} data-testid="reset-button" {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div data-testid="error-card" className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children, className }: any) => (
    <div data-testid="error-card-content" className={className}>
      {children}
    </div>
  ),
}));

// Component that throws an error for testing
const ThrowError = ({ shouldThrow = true, message = 'Test error' }: { shouldThrow?: boolean; message?: string }) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div>Working Component</div>;
};

// Suppress console.error for cleaner test output
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Normal Rendering', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Test Child Component</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test Child Component')).toBeInTheDocument();
      expect(screen.queryByTestId('error-card')).not.toBeInTheDocument();
    });

    it('renders multiple children correctly', () => {
      render(
        <ErrorBoundary>
          <div>First Child</div>
          <div>Second Child</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('First Child')).toBeInTheDocument();
      expect(screen.getByText('Second Child')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('catches errors and shows fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Working Component')).not.toBeInTheDocument();
      expect(screen.getByTestId('error-card')).toBeInTheDocument();
      expect(screen.getByText('เกิดข้อผิดพลาดบางอย่าง')).toBeInTheDocument();
      expect(screen.getByText('ไม่สามารถโหลดส่วนนี้ได้ กรุณาลองใหม่อีกครั้ง')).toBeInTheDocument();
      expect(screen.getByTestId('reset-button')).toBeInTheDocument();
    });

    it('calls logError when error occurs', () => {
      const testError = new Error('Test error message');

      render(
        <ErrorBoundary>
          <ThrowError message="Test error message" />
        </ErrorBoundary>
      );

      expect(logError).toHaveBeenCalledTimes(1);
      expect(logError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error message',
        }),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('calls onError callback when error occurs', () => {
      const onErrorMock = jest.fn();

      render(
        <ErrorBoundary onError={onErrorMock}>
          <ThrowError message="Custom error" />
        </ErrorBoundary>
      );

      expect(onErrorMock).toHaveBeenCalledTimes(1);
      expect(onErrorMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Custom error',
        }),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('does not call onError when no error occurs', () => {
      const onErrorMock = jest.fn();

      render(
        <ErrorBoundary onError={onErrorMock}>
          <div>No Error</div>
        </ErrorBoundary>
      );

      expect(onErrorMock).not.toHaveBeenCalled();
    });
  });

  describe('Reset Functionality', () => {
    it('clears error state when reset button is clicked', async () => {
      const user = userEvent.setup();
      let shouldThrow = true;

      const DynamicComponent = () => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>Working Component</div>;
      };

      const { rerender } = render(
        <ErrorBoundary>
          <DynamicComponent />
        </ErrorBoundary>
      );

      // Error should be displayed
      expect(screen.getByTestId('error-card')).toBeInTheDocument();

      // Stop throwing errors
      shouldThrow = false;

      // Click reset button
      await user.click(screen.getByTestId('reset-button'));

      // Should show working component after reset
      expect(screen.getByText('Working Component')).toBeInTheDocument();
      expect(screen.queryByTestId('error-card')).not.toBeInTheDocument();
    });

    it('reset button has correct text', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('ลองใหม่')).toBeInTheDocument();
    });
  });

  describe('Custom Fallback', () => {
    it('renders custom fallback when provided', () => {
      const customFallback = <div data-testid="custom-fallback">Custom Error UI</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
      expect(screen.queryByTestId('error-card')).not.toBeInTheDocument();
    });

    it('uses default fallback when custom fallback is not provided', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-card')).toBeInTheDocument();
      expect(screen.getByText('เกิดข้อผิดพลาดบางอย่าง')).toBeInTheDocument();
    });
  });

  describe('getDerivedStateFromError', () => {
    it('returns correct state with hasError true and error object', () => {
      const testError = new Error('Test error');
      const state = ErrorBoundary.getDerivedStateFromError(testError);

      expect(state).toEqual({
        hasError: true,
        error: testError,
      });
    });

    it('preserves error message in state', () => {
      const testError = new Error('Specific error message');
      const state = ErrorBoundary.getDerivedStateFromError(testError);

      expect(state.error).toBe(testError);
      expect(state.error?.message).toBe('Specific error message');
    });
  });

  describe('componentDidCatch', () => {
    it('logs error via logError function', () => {
      render(
        <ErrorBoundary>
          <ThrowError message="componentDidCatch test" />
        </ErrorBoundary>
      );

      expect(logError).toHaveBeenCalled();
      const [error, context] = (logError as jest.Mock).mock.calls[0];

      expect(error.message).toBe('componentDidCatch test');
      expect(context).toHaveProperty('componentStack');
    });

    it('passes componentStack to logError', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(logError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );

      // Verify componentStack is defined (not undefined)
      const [, context] = (logError as jest.Mock).mock.calls[0];
      expect(context.componentStack).toBeDefined();
      expect(typeof context.componentStack).toBe('string');
    });
  });
});

describe('CompactErrorBoundary Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when no error occurs', () => {
    render(
      <CompactErrorBoundary>
        <div>Compact Child Content</div>
      </CompactErrorBoundary>
    );

    expect(screen.getByText('Compact Child Content')).toBeInTheDocument();
  });

  it('renders compact fallback when error occurs', () => {
    render(
      <CompactErrorBoundary>
        <ThrowError />
      </CompactErrorBoundary>
    );

    expect(screen.getByText('ไม่สามารถโหลดส่วนนี้ได้')).toBeInTheDocument();
    expect(screen.queryByText('เกิดข้อผิดพลาดบางอย่าง')).not.toBeInTheDocument();
    expect(screen.queryByTestId('reset-button')).not.toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onErrorMock = jest.fn();

    render(
      <CompactErrorBoundary onError={onErrorMock}>
        <ThrowError message="Compact error" />
      </CompactErrorBoundary>
    );

    expect(onErrorMock).toHaveBeenCalledTimes(1);
    expect(onErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Compact error',
      }),
      expect.any(Object)
    );
  });

  it('logs error via logError', () => {
    render(
      <CompactErrorBoundary>
        <ThrowError />
      </CompactErrorBoundary>
    );

    expect(logError).toHaveBeenCalled();
  });

  it('uses ErrorBoundary internally with custom fallback', () => {
    render(
      <CompactErrorBoundary>
        <ThrowError />
      </CompactErrorBoundary>
    );

    // Should not show the full error card
    expect(screen.queryByTestId('error-card')).not.toBeInTheDocument();

    // Should show compact message
    expect(screen.getByText('ไม่สามารถโหลดส่วนนี้ได้')).toBeInTheDocument();
  });
});

describe('Error Boundary Integration', () => {
  it('handles nested error boundaries correctly', () => {
    const outerOnError = jest.fn();
    const innerOnError = jest.fn();

    render(
      <ErrorBoundary onError={outerOnError}>
        <div>Outer Content</div>
        <ErrorBoundary onError={innerOnError}>
          <ThrowError />
        </ErrorBoundary>
      </ErrorBoundary>
    );

    // Inner boundary should catch the error
    expect(innerOnError).toHaveBeenCalled();
    expect(outerOnError).not.toHaveBeenCalled();

    // Outer content should still be visible
    expect(screen.getByText('Outer Content')).toBeInTheDocument();

    // Inner error fallback should be shown
    expect(screen.getByTestId('error-card')).toBeInTheDocument();
  });

  it('handles multiple independent error boundaries', () => {
    render(
      <div>
        <ErrorBoundary>
          <ThrowError message="First error" />
        </ErrorBoundary>
        <ErrorBoundary>
          <div>Working Content</div>
        </ErrorBoundary>
      </div>
    );

    // First boundary shows error
    expect(screen.getByTestId('error-card')).toBeInTheDocument();

    // Second boundary shows content
    expect(screen.getByText('Working Content')).toBeInTheDocument();
  });

  it('different error boundaries can have different custom fallbacks', () => {
    render(
      <div>
        <ErrorBoundary fallback={<div>Custom Fallback 1</div>}>
          <ThrowError />
        </ErrorBoundary>
        <ErrorBoundary fallback={<div>Custom Fallback 2</div>}>
          <ThrowError />
        </ErrorBoundary>
      </div>
    );

    expect(screen.getByText('Custom Fallback 1')).toBeInTheDocument();
    expect(screen.getByText('Custom Fallback 2')).toBeInTheDocument();
  });
});
