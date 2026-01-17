import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignupForm } from '@/components/auth/SignupForm';
import { useAuth } from '@/hooks/useAuth';

// Mock the useAuth hook
jest.mock('@/hooks/useAuth');

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock PasswordStrength component
jest.mock('@/components/auth/PasswordStrength', () => ({
  PasswordStrength: ({ password }: { password: string }) => (
    <div data-testid="password-strength">{password ? 'Strength indicator' : ''}</div>
  ),
}));

describe('SignupForm', () => {
  const mockSignUp = jest.fn();
  const mockSignInWithGoogle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      signUp: mockSignUp,
      signInWithGoogle: mockSignInWithGoogle,
      user: null,
      session: null,
      role: 'user',
      loading: false,
      error: null,
    });
  });

  describe('Rendering', () => {
    it('renders all required fields', () => {
      render(<SignupForm />);

      expect(screen.getByLabelText('ชื่อ-นามสกุล')).toBeInTheDocument();
      expect(screen.getByLabelText('อีเมล')).toBeInTheDocument();
      expect(screen.getByLabelText('รหัสผ่าน')).toBeInTheDocument();
      expect(screen.getByLabelText(/เบอร์โทรศัพท์/)).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<SignupForm />);

      expect(screen.getByRole('button', { name: 'สมัครสมาชิก' })).toBeInTheDocument();
    });

    it('renders Google signup button', () => {
      render(<SignupForm />);

      expect(screen.getByRole('button', { name: /ลงทะเบียนด้วย Google/i })).toBeInTheDocument();
    });

    it('renders link to login page', () => {
      render(<SignupForm />);

      const loginLink = screen.getByRole('link', { name: /เข้าสู่ระบบ/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/auth/login');
    });

    it('indicates phone field is optional', () => {
      render(<SignupForm />);

      expect(screen.getByLabelText(/เบอร์โทรศัพท์.*ไม่บังคับ/i)).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows validation error for invalid email', async () => {
      const user = userEvent.setup();
      render(<SignupForm />);

      const nameInput = screen.getByLabelText('ชื่อ-นามสกุล');
      const emailInput = screen.getByLabelText('อีเมล') as HTMLInputElement;
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const submitButton = screen.getByRole('button', { name: 'สมัครสมาชิก' });

      // Fill required fields
      await user.type(nameInput, 'สมชาย ใจดี');
      await user.type(passwordInput, 'Password123');

      // Type invalid email and remove HTML5 validation
      await user.type(emailInput, 'invalid-email');
      emailInput.type = 'text'; // Bypass HTML5 email validation

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('shows validation error for weak password (too short)', async () => {
      const user = userEvent.setup();
      render(<SignupForm />);

      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const submitButton = screen.getByRole('button', { name: 'สมัครสมาชิก' });

      await user.type(passwordInput, 'short');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('shows validation error for password without uppercase letter', async () => {
      const user = userEvent.setup();
      render(<SignupForm />);

      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const submitButton = screen.getByRole('button', { name: 'สมัครสมาชิก' });

      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must contain at least one uppercase letter')).toBeInTheDocument();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('shows validation error for password without number', async () => {
      const user = userEvent.setup();
      render(<SignupForm />);

      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const submitButton = screen.getByRole('button', { name: 'สมัครสมาชิก' });

      await user.type(passwordInput, 'PasswordOnly');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must contain at least one number')).toBeInTheDocument();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('shows validation error for short name', async () => {
      const user = userEvent.setup();
      render(<SignupForm />);

      const nameInput = screen.getByLabelText('ชื่อ-นามสกุล');
      const submitButton = screen.getByRole('button', { name: 'สมัครสมาชิก' });

      await user.type(nameInput, 'A');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('shows validation error for invalid Thai phone number', async () => {
      const user = userEvent.setup();
      render(<SignupForm />);

      const phoneInput = screen.getByLabelText(/เบอร์โทรศัพท์/);
      const submitButton = screen.getByRole('button', { name: 'สมัครสมาชิก' });

      await user.type(phoneInput, '123456');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid Thai phone number')).toBeInTheDocument();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('accepts valid Thai phone numbers', async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValue({ error: null });
      render(<SignupForm />);

      const nameInput = screen.getByLabelText('ชื่อ-นามสกุล');
      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const phoneInput = screen.getByLabelText(/เบอร์โทรศัพท์/);
      const submitButton = screen.getByRole('button', { name: 'สมัครสมาชิก' });

      await user.type(nameInput, 'สมชาย ใจดี');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');
      await user.type(phoneInput, '0812345678');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          'test@example.com',
          'Password123',
          'สมชาย ใจดี',
          '0812345678'
        );
      });
    });
  });

  describe('Phone field is optional', () => {
    it('allows form submission without phone number', async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValue({ error: null });
      render(<SignupForm />);

      const nameInput = screen.getByLabelText('ชื่อ-นามสกุล');
      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const submitButton = screen.getByRole('button', { name: 'สมัครสมาชิก' });

      await user.type(nameInput, 'สมชาย ใจดี');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          'test@example.com',
          'Password123',
          'สมชาย ใจดี',
          undefined
        );
      });
    });

    it('allows empty string for phone number', async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValue({ error: null });
      render(<SignupForm />);

      const nameInput = screen.getByLabelText('ชื่อ-นามสกุล');
      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const phoneInput = screen.getByLabelText(/เบอร์โทรศัพท์/);
      const submitButton = screen.getByRole('button', { name: 'สมัครสมาชิก' });

      await user.type(nameInput, 'สมชาย ใจดี');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');
      await user.clear(phoneInput);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalled();
      });
    });
  });

  describe('Form submission', () => {
    it('calls signUp function with valid data', async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValue({ error: null });
      render(<SignupForm />);

      const nameInput = screen.getByLabelText('ชื่อ-นามสกุล');
      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const phoneInput = screen.getByLabelText(/เบอร์โทรศัพท์/);
      const submitButton = screen.getByRole('button', { name: 'สมัครสมาชิก' });

      await user.type(nameInput, 'สมชาย ใจดี');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');
      await user.type(phoneInput, '0812345678');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          'test@example.com',
          'Password123',
          'สมชาย ใจดี',
          '0812345678'
        );
      });
    });

    it('displays loading state during submission', async () => {
      const user = userEvent.setup();
      mockSignUp.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100)));
      render(<SignupForm />);

      const nameInput = screen.getByLabelText('ชื่อ-นามสกุล');
      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const submitButton = screen.getByRole('button', { name: 'สมัครสมาชิก' });

      await user.type(nameInput, 'สมชาย ใจดี');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');
      await user.click(submitButton);

      expect(screen.getByRole('button', { name: 'กำลังลงทะเบียน...' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'กำลังลงทะเบียน...' })).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'สมัครสมาชิก' })).toBeInTheDocument();
      });
    });

    it('disables all inputs during submission', async () => {
      const user = userEvent.setup();
      mockSignUp.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100)));
      render(<SignupForm />);

      const nameInput = screen.getByLabelText('ชื่อ-นามสกุล');
      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const phoneInput = screen.getByLabelText(/เบอร์โทรศัพท์/);
      const submitButton = screen.getByRole('button', { name: 'สมัครสมาชิก' });

      await user.type(nameInput, 'สมชาย ใจดี');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');
      await user.click(submitButton);

      expect(nameInput).toBeDisabled();
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(phoneInput).toBeDisabled();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Error handling', () => {
    it('displays error message on signup failure', async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValue({
        error: new Error('Signup failed: Network error')
      });
      render(<SignupForm />);

      const nameInput = screen.getByLabelText('ชื่อ-นามสกุล');
      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const submitButton = screen.getByRole('button', { name: 'สมัครสมาชิก' });

      await user.type(nameInput, 'สมชาย ใจดี');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Signup failed: Network error')).toBeInTheDocument();
      });
    });

    it('displays custom error message for duplicate email', async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValue({
        error: new Error('User already registered')
      });
      render(<SignupForm />);

      const nameInput = screen.getByLabelText('ชื่อ-นามสกุล');
      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const submitButton = screen.getByRole('button', { name: 'สมัครสมาชิก' });

      await user.type(nameInput, 'สมชาย ใจดี');
      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'Password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ')).toBeInTheDocument();
      });
    });

    it('clears previous error message on new submission', async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValueOnce({
        error: new Error('First error')
      }).mockResolvedValueOnce({
        error: null
      });
      render(<SignupForm />);

      const nameInput = screen.getByLabelText('ชื่อ-นามสกุล');
      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const submitButton = screen.getByRole('button', { name: 'สมัครสมาชิก' });

      await user.type(nameInput, 'สมชาย ใจดี');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Success handling', () => {
    it('displays success message on successful signup', async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValue({ error: null });
      render(<SignupForm />);

      const nameInput = screen.getByLabelText('ชื่อ-นามสกุล');
      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const submitButton = screen.getByRole('button', { name: 'สมัครสมาชิก' });

      await user.type(nameInput, 'สมชาย ใจดี');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('ลงทะเบียนสำเร็จ! กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชี')).toBeInTheDocument();
      });
    });

    it('calls onSuccess callback after successful signup', async () => {
      const user = userEvent.setup();
      const onSuccess = jest.fn();
      mockSignUp.mockResolvedValue({ error: null });
      render(<SignupForm onSuccess={onSuccess} />);

      const nameInput = screen.getByLabelText('ชื่อ-นามสกุล');
      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const submitButton = screen.getByRole('button', { name: 'สมัครสมาชิก' });

      await user.type(nameInput, 'สมชาย ใจดี');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('does not call onSuccess callback on signup failure', async () => {
      const user = userEvent.setup();
      const onSuccess = jest.fn();
      mockSignUp.mockResolvedValue({
        error: new Error('Signup failed')
      });
      render(<SignupForm onSuccess={onSuccess} />);

      const nameInput = screen.getByLabelText('ชื่อ-นามสกุล');
      const emailInput = screen.getByLabelText('อีเมล');
      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      const submitButton = screen.getByRole('button', { name: 'สมัครสมาชิก' });

      await user.type(nameInput, 'สมชาย ใจดี');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Signup failed')).toBeInTheDocument();
      });

      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Google signup', () => {
    it('calls signInWithGoogle when Google button is clicked', async () => {
      const user = userEvent.setup();
      mockSignInWithGoogle.mockResolvedValue({ error: null });
      render(<SignupForm />);

      const googleButton = screen.getByRole('button', { name: /ลงทะเบียนด้วย Google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
      });
    });

    it('displays error message on Google signup failure', async () => {
      const user = userEvent.setup();
      mockSignInWithGoogle.mockResolvedValue({
        error: new Error('Google signup failed')
      });
      render(<SignupForm />);

      const googleButton = screen.getByRole('button', { name: /ลงทะเบียนด้วย Google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(screen.getByText('Google signup failed')).toBeInTheDocument();
      });
    });

    it('disables buttons during Google signup', async () => {
      const user = userEvent.setup();
      mockSignInWithGoogle.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100)));
      render(<SignupForm />);

      const googleButton = screen.getByRole('button', { name: /ลงทะเบียนด้วย Google/i });
      const submitButton = screen.getByRole('button', { name: 'สมัครสมาชิก' });

      await user.click(googleButton);

      expect(googleButton).toBeDisabled();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalled();
      });
    });
  });

  describe('Password strength indicator', () => {
    it('displays password strength indicator when password is entered', async () => {
      const user = userEvent.setup();
      render(<SignupForm />);

      const passwordInput = screen.getByLabelText('รหัสผ่าน');
      await user.type(passwordInput, 'Password123');

      expect(screen.getByTestId('password-strength')).toHaveTextContent('Strength indicator');
    });

    it('does not display strength indicator when password is empty', () => {
      render(<SignupForm />);

      const strengthIndicator = screen.getByTestId('password-strength');
      expect(strengthIndicator).toHaveTextContent('');
    });
  });
});
