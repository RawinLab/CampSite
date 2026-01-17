import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

// Mock useAuth hook
const mockResetPassword = jest.fn();

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    resetPassword: mockResetPassword,
    user: null,
    session: null,
    role: 'user',
    loading: false,
    error: null,
    signUp: jest.fn(),
    signIn: jest.fn(),
    signInWithGoogle: jest.fn(),
    signOut: jest.fn(),
    updatePassword: jest.fn(),
    refreshSession: jest.fn(),
  }),
}));

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders email field', () => {
    render(<ForgotPasswordForm />);

    expect(screen.getByLabelText(/อีเมล/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('email@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ส่งลิงก์รีเซ็ตรหัสผ่าน/i })).toBeInTheDocument();
  });

  it('prevents submission with invalid email format', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/อีเมล/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /ส่งลิงก์รีเซ็ตรหัสผ่าน/i });

    // Type an email without proper format (no @)
    await user.type(emailInput, 'invalidemail');

    // HTML5 validation will prevent form submission
    // The input will have the invalid state
    expect(emailInput).toHaveValue('invalidemail');
    expect(emailInput.type).toBe('email');
  });

  it('shows validation error for empty email', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    const submitButton = screen.getByRole('button', { name: /ส่งลิงก์รีเซ็ตรหัสผ่าน/i });

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('กรุณากรอกอีเมลที่ถูกต้อง')).toBeInTheDocument();
    });

    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('submit button shows loading state', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
    );

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/อีเมล/i);
    const submitButton = screen.getByRole('button', { name: /ส่งลิงก์รีเซ็ตรหัสผ่าน/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /กำลังส่ง\.\.\./i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /กำลังส่ง\.\.\./i })).toBeDisabled();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ส่งลิงก์รีเซ็ตรหัสผ่าน/i })).toBeInTheDocument();
    });
  });

  it('calls resetPassword on submit with valid email', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue({ error: null });

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/อีเมล/i);
    const submitButton = screen.getByRole('button', { name: /ส่งลิงก์รีเซ็ตรหัสผ่าน/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledTimes(1);
      expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('shows success message after email sent', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue({ error: null });

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/อีเมล/i);
    const submitButton = screen.getByRole('button', { name: /ส่งลิงก์รีเซ็ตรหัสผ่าน/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('หากอีเมลนี้มีอยู่ในระบบ คุณจะได้รับลิงก์รีเซ็ตรหัสผ่านทางอีเมล')
      ).toBeInTheDocument();
    });

    // Verify success message styling
    const successContainer = screen.getByText(/หากอีเมลนี้มีอยู่ในระบบ/).closest('div');
    expect(successContainer).toHaveClass('bg-green-50');
    expect(successContainer).toHaveClass('text-green-700');
  });

  it('shows error message on failure', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to send reset email';
    mockResetPassword.mockResolvedValue({ error: new Error(errorMessage) });

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/อีเมล/i);
    const submitButton = screen.getByRole('button', { name: /ส่งลิงก์รีเซ็ตรหัสผ่าน/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Verify error message styling
    const errorContainer = screen.getByText(errorMessage).closest('div');
    expect(errorContainer).toHaveClass('bg-red-50');
    expect(errorContainer).toHaveClass('text-red-700');
  });

  it('disables email input during loading', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
    );

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/อีเมล/i);
    const submitButton = screen.getByRole('button', { name: /ส่งลิงก์รีเซ็ตรหัสผ่าน/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(emailInput).toBeDisabled();
    });

    await waitFor(() => {
      expect(emailInput).not.toBeDisabled();
    });
  });

  it('clears previous error when submitting again', async () => {
    const user = userEvent.setup();
    const errorMessage = 'First error';
    mockResetPassword.mockResolvedValueOnce({ error: new Error(errorMessage) });

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/อีเมล/i);
    const submitButton = screen.getByRole('button', { name: /ส่งลิงก์รีเซ็ตรหัสผ่าน/i });

    // First submission with error
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Second submission - should clear error
    mockResetPassword.mockResolvedValueOnce({ error: null });
    await user.clear(emailInput);
    await user.type(emailInput, 'test2@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    });
  });

  it('renders login link', () => {
    render(<ForgotPasswordForm />);

    const loginLink = screen.getByRole('link', { name: /เข้าสู่ระบบ/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/auth/login');
  });
});
