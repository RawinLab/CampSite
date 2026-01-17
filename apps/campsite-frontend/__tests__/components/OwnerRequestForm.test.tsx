import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OwnerRequestForm } from '@/components/auth/OwnerRequestForm';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

// Mock dependencies
jest.mock('@/hooks/useAuth');
jest.mock('@/lib/supabase/client');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('OwnerRequestForm', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockSupabase = {
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default auth state: logged in as user
    mockUseAuth.mockReturnValue({
      user: mockUser,
      role: 'user',
      isLoading: false,
      signOut: jest.fn(),
    });

    mockCreateClient.mockReturnValue(mockSupabase as any);
  });

  describe('Role-based rendering', () => {
    it('shows info message when user is already an owner', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        role: 'owner',
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<OwnerRequestForm />);

      expect(
        screen.getByText(/คุณเป็นเจ้าของแคมป์ไซต์อยู่แล้ว/)
      ).toBeInTheDocument();
      expect(screen.queryByLabelText(/ชื่อธุรกิจ/)).not.toBeInTheDocument();
    });

    it('shows info message when user is admin', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        role: 'admin',
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<OwnerRequestForm />);

      expect(
        screen.getByText(/คุณเป็นผู้ดูแลระบบ/)
      ).toBeInTheDocument();
      expect(screen.queryByLabelText(/ชื่อธุรกิจ/)).not.toBeInTheDocument();
    });
  });

  describe('Form rendering', () => {
    it('renders all required fields', () => {
      render(<OwnerRequestForm />);

      expect(screen.getByLabelText(/ชื่อธุรกิจ/)).toBeInTheDocument();
      expect(screen.getByLabelText(/รายละเอียดธุรกิจ/)).toBeInTheDocument();
      expect(screen.getByLabelText(/เบอร์โทรศัพท์ติดต่อ/)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /ส่งคำขอเป็นเจ้าของแคมป์ไซต์/ })
      ).toBeInTheDocument();
    });

    it('renders informational note', () => {
      render(<OwnerRequestForm />);

      expect(
        screen.getByText(/หลังจากส่งคำขอ ทีมงานจะตรวจสอบข้อมูล/)
      ).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows validation errors for missing required fields', async () => {
      const user = userEvent.setup();
      render(<OwnerRequestForm />);

      const submitButton = screen.getByRole('button', {
        name: /ส่งคำขอเป็นเจ้าของแคมป์ไซต์/,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Business name must be at least 3 characters/)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/Description must be at least 20 characters/)
        ).toBeInTheDocument();
        expect(screen.getByText(/Invalid Thai phone number/)).toBeInTheDocument();
      });
    });

    it('validates business name minimum length', async () => {
      const user = userEvent.setup();
      render(<OwnerRequestForm />);

      const businessNameInput = screen.getByLabelText(/ชื่อธุรกิจ/);
      await user.type(businessNameInput, 'AB');

      const submitButton = screen.getByRole('button', {
        name: /ส่งคำขอเป็นเจ้าของแคมป์ไซต์/,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Business name must be at least 3 characters/)
        ).toBeInTheDocument();
      });
    });

    it('validates business description minimum length', async () => {
      const user = userEvent.setup();
      render(<OwnerRequestForm />);

      const descriptionInput = screen.getByLabelText(/รายละเอียดธุรกิจ/);
      await user.type(descriptionInput, 'Short description');

      const submitButton = screen.getByRole('button', {
        name: /ส่งคำขอเป็นเจ้าของแคมป์ไซต์/,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Description must be at least 20 characters/)
        ).toBeInTheDocument();
      });
    });

    it('validates phone number format', async () => {
      const user = userEvent.setup();
      render(<OwnerRequestForm />);

      const phoneInput = screen.getByLabelText(/เบอร์โทรศัพท์ติดต่อ/);
      await user.type(phoneInput, '123456');

      const submitButton = screen.getByRole('button', {
        name: /ส่งคำขอเป็นเจ้าของแคมป์ไซต์/,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid Thai phone number/)).toBeInTheDocument();
      });
    });
  });

  describe('Form submission', () => {
    const validFormData = {
      business_name: 'Test Campsite',
      business_description:
        'This is a valid description that meets the minimum length requirement',
      contact_phone: '0812345678',
    };

    it('disables submit button while loading', async () => {
      const user = userEvent.setup();

      // Mock successful insert (so form stays in loading state briefly)
      const mockInsert = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: null, error: null }), 200)
          )
      );

      // Mock no pending request
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });
      const mockEq2 = jest.fn().mockReturnValue({
        single: mockSingle,
      });
      const mockEq1 = jest.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq1,
      });

      mockSupabase.from.mockImplementation(() => ({
        select: mockSelect,
        insert: mockInsert,
      }));

      render(<OwnerRequestForm />);

      // Fill form
      await user.type(
        screen.getByLabelText(/ชื่อธุรกิจ/),
        validFormData.business_name
      );
      await user.type(
        screen.getByLabelText(/รายละเอียดธุรกิจ/),
        validFormData.business_description
      );
      await user.type(
        screen.getByLabelText(/เบอร์โทรศัพท์ติดต่อ/),
        validFormData.contact_phone
      );

      const submitButton = screen.getByRole('button', {
        name: /ส่งคำขอเป็นเจ้าของแคมป์ไซต์/,
      });

      // Click submit
      await user.click(submitButton);

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByText(/กำลังส่งคำขอ.../)).toBeInTheDocument();
      });
    });

    it('shows error when user is not logged in', async () => {
      const user = userEvent.setup();

      mockUseAuth.mockReturnValue({
        user: null,
        role: null,
        isLoading: false,
        signOut: jest.fn(),
      });

      render(<OwnerRequestForm />);

      // Fill form
      await user.type(
        screen.getByLabelText(/ชื่อธุรกิจ/),
        validFormData.business_name
      );
      await user.type(
        screen.getByLabelText(/รายละเอียดธุรกิจ/),
        validFormData.business_description
      );
      await user.type(
        screen.getByLabelText(/เบอร์โทรศัพท์ติดต่อ/),
        validFormData.contact_phone
      );

      const submitButton = screen.getByRole('button', {
        name: /ส่งคำขอเป็นเจ้าของแคมป์ไซต์/,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/กรุณาเข้าสู่ระบบก่อน/)).toBeInTheDocument();
      });
    });

    it('shows error when user has existing pending request', async () => {
      const user = userEvent.setup();

      // Mock existing pending request
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: 'request-123', status: 'pending' },
        error: null,
      });
      const mockEq2 = jest.fn().mockReturnValue({
        single: mockSingle,
      });
      const mockEq1 = jest.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq1,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      render(<OwnerRequestForm />);

      // Fill and submit form
      await user.type(
        screen.getByLabelText(/ชื่อธุรกิจ/),
        validFormData.business_name
      );
      await user.type(
        screen.getByLabelText(/รายละเอียดธุรกิจ/),
        validFormData.business_description
      );
      await user.type(
        screen.getByLabelText(/เบอร์โทรศัพท์ติดต่อ/),
        validFormData.contact_phone
      );

      const submitButton = screen.getByRole('button', {
        name: /ส่งคำขอเป็นเจ้าของแคมป์ไซต์/,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/คุณมีคำขอที่รอการอนุมัติอยู่แล้ว/)
        ).toBeInTheDocument();
      });
    });

    it('successfully submits new owner request', async () => {
      const user = userEvent.setup();
      const onSuccess = jest.fn();

      // Mock successful insert
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      // Mock no pending request
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });
      const mockEq2 = jest.fn().mockReturnValue({
        single: mockSingle,
      });
      const mockEq1 = jest.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq1,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        return {
          select: mockSelect,
          insert: mockInsert,
        };
      });

      render(<OwnerRequestForm onSuccess={onSuccess} />);

      // Fill and submit form
      await user.type(
        screen.getByLabelText(/ชื่อธุรกิจ/),
        validFormData.business_name
      );
      await user.type(
        screen.getByLabelText(/รายละเอียดธุรกิจ/),
        validFormData.business_description
      );
      await user.type(
        screen.getByLabelText(/เบอร์โทรศัพท์ติดต่อ/),
        validFormData.contact_phone
      );

      const submitButton = screen.getByRole('button', {
        name: /ส่งคำขอเป็นเจ้าของแคมป์ไซต์/,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/ส่งคำขอสำเร็จแล้ว!/)
        ).toBeInTheDocument();
      });

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        business_name: validFormData.business_name,
        business_description: validFormData.business_description,
        contact_phone: validFormData.contact_phone,
        status: 'pending',
      });

      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('shows error message on database failure', async () => {
      const user = userEvent.setup();

      // Mock insert failure
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      });

      // Mock no pending request
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });
      const mockEq2 = jest.fn().mockReturnValue({
        single: mockSingle,
      });
      const mockEq1 = jest.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq1,
      });

      mockSupabase.from.mockImplementation(() => ({
        select: mockSelect,
        insert: mockInsert,
      }));

      render(<OwnerRequestForm />);

      // Fill and submit form
      await user.type(
        screen.getByLabelText(/ชื่อธุรกิจ/),
        validFormData.business_name
      );
      await user.type(
        screen.getByLabelText(/รายละเอียดธุรกิจ/),
        validFormData.business_description
      );
      await user.type(
        screen.getByLabelText(/เบอร์โทรศัพท์ติดต่อ/),
        validFormData.contact_phone
      );

      const submitButton = screen.getByRole('button', {
        name: /ส่งคำขอเป็นเจ้าของแคมป์ไซต์/,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง/)
        ).toBeInTheDocument();
      });
    });

    it('handles duplicate request error (23505)', async () => {
      const user = userEvent.setup();

      // Mock duplicate key error
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'Duplicate key' },
      });

      // Mock no pending request in check
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });
      const mockEq2 = jest.fn().mockReturnValue({
        single: mockSingle,
      });
      const mockEq1 = jest.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq1,
      });

      mockSupabase.from.mockImplementation(() => ({
        select: mockSelect,
        insert: mockInsert,
      }));

      render(<OwnerRequestForm />);

      // Fill and submit form
      await user.type(
        screen.getByLabelText(/ชื่อธุรกิจ/),
        validFormData.business_name
      );
      await user.type(
        screen.getByLabelText(/รายละเอียดธุรกิจ/),
        validFormData.business_description
      );
      await user.type(
        screen.getByLabelText(/เบอร์โทรศัพท์ติดต่อ/),
        validFormData.contact_phone
      );

      const submitButton = screen.getByRole('button', {
        name: /ส่งคำขอเป็นเจ้าของแคมป์ไซต์/,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/คุณมีคำขอที่รอการอนุมัติอยู่แล้ว/)
        ).toBeInTheDocument();
      });
    });

    it('disables form inputs while loading', async () => {
      const user = userEvent.setup();

      // Mock pending request check that takes time
      const mockSingle = jest
        .fn()
        .mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(
                () => resolve({ data: null, error: { code: 'PGRST116' } }),
                100
              )
            )
        );
      const mockEq2 = jest.fn().mockReturnValue({
        single: mockSingle,
      });
      const mockEq1 = jest.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq1,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      render(<OwnerRequestForm />);

      // Fill form
      await user.type(
        screen.getByLabelText(/ชื่อธุรกิจ/),
        validFormData.business_name
      );
      await user.type(
        screen.getByLabelText(/รายละเอียดธุรกิจ/),
        validFormData.business_description
      );
      await user.type(
        screen.getByLabelText(/เบอร์โทรศัพท์ติดต่อ/),
        validFormData.contact_phone
      );

      const submitButton = screen.getByRole('button', {
        name: /ส่งคำขอเป็นเจ้าของแคมป์ไซต์/,
      });

      await user.click(submitButton);

      // Check that inputs are disabled during loading
      await waitFor(() => {
        expect(screen.getByLabelText(/ชื่อธุรกิจ/)).toBeDisabled();
        expect(screen.getByLabelText(/รายละเอียดธุรกิจ/)).toBeDisabled();
        expect(screen.getByLabelText(/เบอร์โทรศัพท์ติดต่อ/)).toBeDisabled();
        expect(submitButton).toBeDisabled();
      });
    });
  });
});
