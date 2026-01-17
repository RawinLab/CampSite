import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

describe('LoginForm', () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();
  const mockSignIn = jest.fn();
  const mockSignInWithGoogle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });

    // Setup auth hook mock
    (useAuth as jest.Mock).mockReturnValue({
      signIn: mockSignIn,
      signInWithGoogle: mockSignInWithGoogle,
      user: null,
      session: null,
      role: 'user',
      loading: false,
      error: null,
    });
  });

  describe('Rendering', () => {
    it('renders email and password fields', () => {
      render(<LoginForm />);

      expect(screen.getByLabelText('อีเมล')).toBeInTheDocument();
      expect(screen.getByLabelText('รหัสผ่าน')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'เข้าสู่ระบบ' })).toBeInTheDocument();
    });

    it('renders forgot password link', () => {
      render(<LoginForm />);

      const forgotPasswordLink = screen.getByRole('link', { name: 'ลืมรหัสผ่าน?' });
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink).toHaveAttribute('href', '/auth/forgot-password');
    });

    it('renders signup link', () => {
      render(<LoginForm />);

      const signupLink = screen.getByRole('link', { name: 'สมัครสมาชิก' });
      expect(signupLink).toBeInTheDocument();
      expect(signupLink).toHaveAttribute('href', '/auth/signup');
    });

    it('renders Google login button', () => {
      render(<LoginForm />);

      expect(screen.getByRole('button', { name: /เข้าสู่ระบบด้วย Google/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows validation error for invalid email format', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText('อีเมล') as HTMLInputElement;
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const submitButton = screen.getByRole('button', { name: 'เข้าสู่ระบบ' });

      // Change input type temporarily to bypass HTML5 validation
      emailInput.type = 'text';

      await user.type(emailInput, 'notanemail');
      await user.type(passwordInput, 'somepassword');

      // Trigger form submission
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument();
      });

      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('shows validation error for empty password', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText('อีเมล');
      const submitButton = screen.getByRole('button', { name: 'เข้าสู่ระบบ' });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });

      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('does not show validation error for valid credentials', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ error: null });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const submitButton = screen.getByRole('button', { name: 'เข้าสู่ระบบ' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'p');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'p');
      });
    });
  });

  describe('Form Submission', () => {
    it('submit button is disabled while loading', async () => {
      const user = userEvent.setup();
      mockSignIn.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ error: null }), 100)
          )
      );

      render(<LoginForm />);

      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const submitButton = screen.getByRole('button', { name: 'เข้าสู่ระบบ' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveTextContent('กำลังเข้าสู่ระบบ...');
      });
    });

    it('calls signIn with email and password on submit', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ error: null });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const submitButton = screen.getByRole('button', { name: 'เข้าสู่ระบบ' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('disables inputs while loading', async () => {
      const user = userEvent.setup();
      mockSignIn.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ error: null }), 100)
          )
      );

      render(<LoginForm />);

      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }));

      await waitFor(() => {
        expect(emailInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
      });
    });
  });

  describe('Authentication Success', () => {
    it('redirects to default path on successful login', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ error: null });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('redirects to custom path when redirectTo is provided', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ error: null });

      render(<LoginForm redirectTo="/dashboard" />);

      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
        expect(mockRefresh).toHaveBeenCalled();
      });
    });
  });

  describe('Authentication Failure', () => {
    it('shows error message for invalid credentials', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({
        error: { message: 'Invalid login credentials' } as Error,
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }));

      await waitFor(() => {
        expect(screen.getByText('อีเมลหรือรหัสผ่านไม่ถูกต้อง')).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('shows error message for unconfirmed email', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({
        error: { message: 'Email not confirmed' } as Error,
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }));

      await waitFor(() => {
        expect(screen.getByText('กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ')).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('shows generic error message for other errors', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({
        error: { message: 'Network error occurred' } as Error,
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }));

      await waitFor(() => {
        expect(screen.getByText('Network error occurred')).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('clears previous error message on new submission', async () => {
      const user = userEvent.setup();
      mockSignIn
        .mockResolvedValueOnce({
          error: { message: 'Invalid login credentials' } as Error,
        })
        .mockResolvedValueOnce({ error: null });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const submitButton = screen.getByRole('button', { name: 'เข้าสู่ระบบ' });

      // First submission with error
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('อีเมลหรือรหัสผ่านไม่ถูกต้อง')).toBeInTheDocument();
      });

      // Second submission successful
      await user.clear(passwordInput);
      await user.type(passwordInput, 'correctpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('อีเมลหรือรหัสผ่านไม่ถูกต้อง')).not.toBeInTheDocument();
      });
    });
  });

  describe('Google Login', () => {
    it('calls signInWithGoogle when Google button is clicked', async () => {
      const user = userEvent.setup();
      mockSignInWithGoogle.mockResolvedValue({ error: null });

      render(<LoginForm />);

      const googleButton = screen.getByRole('button', {
        name: /เข้าสู่ระบบด้วย Google/i,
      });

      await user.click(googleButton);

      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalled();
      });
    });

    it('shows error message when Google login fails', async () => {
      const user = userEvent.setup();
      mockSignInWithGoogle.mockResolvedValue({
        error: { message: 'Google authentication failed' } as Error,
      });

      render(<LoginForm />);

      const googleButton = screen.getByRole('button', {
        name: /เข้าสู่ระบบด้วย Google/i,
      });

      await user.click(googleButton);

      await waitFor(() => {
        expect(screen.getByText('Google authentication failed')).toBeInTheDocument();
      });
    });

    it('disables all buttons while Google login is in progress', async () => {
      const user = userEvent.setup();
      mockSignInWithGoogle.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ error: null }), 100)
          )
      );

      render(<LoginForm />);

      const googleButton = screen.getByRole('button', {
        name: /เข้าสู่ระบบด้วย Google/i,
      });
      const submitButton = screen.getByRole('button', { name: 'เข้าสู่ระบบ' });

      await user.click(googleButton);

      await waitFor(() => {
        expect(googleButton).toBeDisabled();
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for form inputs', () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('displays error messages with proper role', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({
        error: { message: 'Invalid login credentials' } as Error,
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }));

      await waitFor(() => {
        const errorElement = screen.getByText('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        expect(errorElement).toBeInTheDocument();
      });
    });
  });
});
