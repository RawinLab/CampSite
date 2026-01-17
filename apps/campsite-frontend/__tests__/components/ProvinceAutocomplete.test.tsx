import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProvinceAutocomplete } from '@/components/search/ProvinceAutocomplete';
import { useProvinceSearch } from '@/hooks/useProvinceSearch';
import type { ProvinceSuggestion } from '@campsite/shared';

// Mock useProvinceSearch hook
jest.mock('@/hooks/useProvinceSearch', () => ({
  useProvinceSearch: jest.fn(),
}));

describe('ProvinceAutocomplete', () => {
  const mockOnChange = jest.fn();
  const mockSetQuery = jest.fn();
  const mockClearSuggestions = jest.fn();

  const mockSuggestions: ProvinceSuggestion[] = [
    {
      id: 'prov-001',
      name_th: 'กรุงเทพมหานคร',
      name_en: 'Bangkok',
      region_id: 'reg-001',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'prov-002',
      name_th: 'เชียงใหม่',
      name_en: 'Chiang Mai',
      region_id: 'reg-002',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'prov-003',
      name_th: 'ภูเก็ต',
      name_en: 'Phuket',
      region_id: 'reg-003',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
    (useProvinceSearch as jest.Mock).mockReturnValue({
      query: '',
      setQuery: mockSetQuery,
      suggestions: [],
      isLoading: false,
      error: null,
      clearSuggestions: mockClearSuggestions,
    });
  });

  describe('Rendering', () => {
    it('renders search input field', () => {
      render(<ProvinceAutocomplete value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('combobox', { name: 'ค้นหาจังหวัด' });
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });

    it('renders with default placeholder', () => {
      render(<ProvinceAutocomplete value={null} onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('ค้นหาจังหวัด...');
      expect(input).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(
        <ProvinceAutocomplete
          value={null}
          onChange={mockOnChange}
          placeholder="Select province"
        />
      );

      const input = screen.getByPlaceholderText('Select province');
      expect(input).toBeInTheDocument();
    });

    it('renders with initial value', () => {
      render(
        <ProvinceAutocomplete value={mockSuggestions[0]} onChange={mockOnChange} />
      );

      const input = screen.getByRole('combobox') as HTMLInputElement;
      expect(input.value).toBe('กรุงเทพมหานคร');
    });

    it('displays clear button when input has value', () => {
      render(
        <ProvinceAutocomplete value={mockSuggestions[0]} onChange={mockOnChange} />
      );

      const clearButton = screen.getByRole('button', { name: 'ล้าง' });
      expect(clearButton).toBeInTheDocument();
    });

    it('does not display clear button when input is empty', () => {
      render(<ProvinceAutocomplete value={null} onChange={mockOnChange} />);

      const clearButton = screen.queryByRole('button', { name: 'ล้าง' });
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading state while fetching', async () => {
      (useProvinceSearch as jest.Mock).mockReturnValue({
        query: 'กรุง',
        setQuery: mockSetQuery,
        suggestions: [],
        isLoading: true,
        error: null,
        clearSuggestions: mockClearSuggestions,
      });

      const user = userEvent.setup();
      render(<ProvinceAutocomplete value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('combobox');
      await user.type(input, 'กรุง');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText('กำลังค้นหา...')).toBeInTheDocument();
      });
    });

    it('hides loading state after fetch completes', async () => {
      const { rerender } = render(
        <ProvinceAutocomplete value={null} onChange={mockOnChange} />
      );

      // Set loading state
      (useProvinceSearch as jest.Mock).mockReturnValue({
        query: 'กรุง',
        setQuery: mockSetQuery,
        suggestions: [],
        isLoading: true,
        error: null,
        clearSuggestions: mockClearSuggestions,
      });

      rerender(<ProvinceAutocomplete value={null} onChange={mockOnChange} />);

      const user = userEvent.setup();
      const input = screen.getByRole('combobox');
      await user.type(input, 'กรุง');

      expect(screen.getByText('กำลังค้นหา...')).toBeInTheDocument();

      // Set loaded state with suggestions
      (useProvinceSearch as jest.Mock).mockReturnValue({
        query: 'กรุง',
        setQuery: mockSetQuery,
        suggestions: [mockSuggestions[0]],
        isLoading: false,
        error: null,
        clearSuggestions: mockClearSuggestions,
      });

      rerender(<ProvinceAutocomplete value={null} onChange={mockOnChange} />);

      await waitFor(() => {
        expect(screen.queryByText('กำลังค้นหา...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Province Suggestions', () => {
    it('displays province suggestions when typing', async () => {
      (useProvinceSearch as jest.Mock).mockReturnValue({
        query: 'กรุง',
        setQuery: mockSetQuery,
        suggestions: mockSuggestions,
        isLoading: false,
        error: null,
        clearSuggestions: mockClearSuggestions,
      });

      const user = userEvent.setup();
      render(<ProvinceAutocomplete value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('combobox');
      await user.type(input, 'กรุง');

      await waitFor(() => {
        expect(screen.getByText('กรุงเทพมหานคร')).toBeInTheDocument();
        expect(screen.getByText('เชียงใหม่')).toBeInTheDocument();
        expect(screen.getByText('ภูเก็ต')).toBeInTheDocument();
      });
    });

    it('shows Thai and English province names', async () => {
      (useProvinceSearch as jest.Mock).mockReturnValue({
        query: 'bangkok',
        setQuery: mockSetQuery,
        suggestions: [mockSuggestions[0]],
        isLoading: false,
        error: null,
        clearSuggestions: mockClearSuggestions,
      });

      const user = userEvent.setup();
      render(<ProvinceAutocomplete value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('combobox');
      await user.type(input, 'bangkok');

      await waitFor(() => {
        expect(screen.getByText('กรุงเทพมหานคร')).toBeInTheDocument();
        expect(screen.getByText('Bangkok')).toBeInTheDocument();
      });
    });

    it('displays dropdown only after 2+ characters typed', async () => {
      const user = userEvent.setup();
      render(<ProvinceAutocomplete value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('combobox');

      // Type 1 character
      await user.type(input, 'ก');

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

      // Type 2 characters
      (useProvinceSearch as jest.Mock).mockReturnValue({
        query: 'กรุ',
        setQuery: mockSetQuery,
        suggestions: mockSuggestions,
        isLoading: false,
        error: null,
        clearSuggestions: mockClearSuggestions,
      });

      await user.type(input, 'รุ');

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('highlights selected province in suggestions', async () => {
      (useProvinceSearch as jest.Mock).mockReturnValue({
        query: 'กรุง',
        setQuery: mockSetQuery,
        suggestions: mockSuggestions,
        isLoading: false,
        error: null,
        clearSuggestions: mockClearSuggestions,
      });

      const user = userEvent.setup();
      render(
        <ProvinceAutocomplete value={mockSuggestions[0]} onChange={mockOnChange} />
      );

      const input = screen.getByRole('combobox');
      await user.type(input, 'กรุง');

      await waitFor(() => {
        const selectedOption = screen.getByRole('option', { selected: true });
        expect(selectedOption).toHaveTextContent('กรุงเทพมหานคร');
      });
    });
  });

  describe('Selecting Province', () => {
    it('calls onSelect callback when province is selected', async () => {
      (useProvinceSearch as jest.Mock).mockReturnValue({
        query: 'เชียง',
        setQuery: mockSetQuery,
        suggestions: mockSuggestions,
        isLoading: false,
        error: null,
        clearSuggestions: mockClearSuggestions,
      });

      const user = userEvent.setup();
      render(<ProvinceAutocomplete value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('combobox');
      await user.type(input, 'เชียง');

      await waitFor(() => {
        expect(screen.getByText('เชียงใหม่')).toBeInTheDocument();
      });

      const chiangMaiOption = screen.getByText('เชียงใหม่');
      await user.click(chiangMaiOption);

      expect(mockOnChange).toHaveBeenCalledWith(mockSuggestions[1]);
      expect(mockClearSuggestions).toHaveBeenCalled();
    });

    it('updates input value when province is selected', async () => {
      (useProvinceSearch as jest.Mock).mockReturnValue({
        query: 'ภูเก็ต',
        setQuery: mockSetQuery,
        suggestions: mockSuggestions,
        isLoading: false,
        error: null,
        clearSuggestions: mockClearSuggestions,
      });

      const user = userEvent.setup();
      render(<ProvinceAutocomplete value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('combobox') as HTMLInputElement;
      await user.type(input, 'ภูเก็ต');

      const phuketOption = screen.getByText('ภูเก็ต');
      await user.click(phuketOption);

      await waitFor(() => {
        expect(input.value).toBe('ภูเก็ต');
      });
    });

    it('closes dropdown after selection', async () => {
      (useProvinceSearch as jest.Mock).mockReturnValue({
        query: 'กรุง',
        setQuery: mockSetQuery,
        suggestions: mockSuggestions,
        isLoading: false,
        error: null,
        clearSuggestions: mockClearSuggestions,
      });

      const user = userEvent.setup();
      render(<ProvinceAutocomplete value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('combobox');
      await user.type(input, 'กรุง');

      const bangkokOption = screen.getByText('กรุงเทพมหานคร');
      await user.click(bangkokOption);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('Clear Button', () => {
    it('resets selection when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ProvinceAutocomplete value={mockSuggestions[0]} onChange={mockOnChange} />
      );

      const clearButton = screen.getByRole('button', { name: 'ล้าง' });
      await user.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledWith(null);
      expect(mockSetQuery).toHaveBeenCalledWith('');
      expect(mockClearSuggestions).toHaveBeenCalled();
    });

    it('clears input value when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ProvinceAutocomplete value={mockSuggestions[0]} onChange={mockOnChange} />
      );

      const input = screen.getByRole('combobox') as HTMLInputElement;
      expect(input.value).toBe('กรุงเทพมหานคร');

      const clearButton = screen.getByRole('button', { name: 'ล้าง' });
      await user.click(clearButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('focuses input after clearing', async () => {
      const user = userEvent.setup();
      render(
        <ProvinceAutocomplete value={mockSuggestions[0]} onChange={mockOnChange} />
      );

      const input = screen.getByRole('combobox');
      const clearButton = screen.getByRole('button', { name: 'ล้าง' });
      await user.click(clearButton);

      await waitFor(() => {
        expect(input).toHaveFocus();
      });
    });
  });

  describe('Empty Results', () => {
    it('shows "no results" message when no provinces match', async () => {
      (useProvinceSearch as jest.Mock).mockReturnValue({
        query: 'xyz',
        setQuery: mockSetQuery,
        suggestions: [],
        isLoading: false,
        error: null,
        clearSuggestions: mockClearSuggestions,
      });

      const user = userEvent.setup();
      render(<ProvinceAutocomplete value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('combobox');
      await user.type(input, 'xyz');

      await waitFor(() => {
        expect(screen.getByText('ไม่พบจังหวัด')).toBeInTheDocument();
      });
    });

    it('does not show "no results" message for queries less than 2 characters', async () => {
      const user = userEvent.setup();
      render(<ProvinceAutocomplete value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('combobox');
      await user.type(input, 'x');

      expect(screen.queryByText('ไม่พบจังหวัด')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('closes dropdown when Escape key is pressed', async () => {
      (useProvinceSearch as jest.Mock).mockReturnValue({
        query: 'กรุง',
        setQuery: mockSetQuery,
        suggestions: mockSuggestions,
        isLoading: false,
        error: null,
        clearSuggestions: mockClearSuggestions,
      });

      const user = userEvent.setup();
      render(<ProvinceAutocomplete value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('combobox');
      await user.type(input, 'กรุง');

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('opens dropdown when input is focused', async () => {
      // Mock hook to always return suggestions
      (useProvinceSearch as jest.Mock).mockReturnValue({
        query: 'กรุง',
        setQuery: mockSetQuery,
        suggestions: mockSuggestions,
        isLoading: false,
        error: null,
        clearSuggestions: mockClearSuggestions,
      });

      const user = userEvent.setup();
      render(<ProvinceAutocomplete value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('combobox');

      // Type to trigger dropdown - the dropdown needs inputValue >= 2 chars OR suggestions.length > 0
      await user.type(input, 'กรุง');

      // Dropdown should be visible because:
      // 1. isOpen is true (set by handleInputChange)
      // 2. inputValue.length >= 2 OR suggestions.length > 0
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Close dropdown with Escape
      await user.keyboard('{Escape}');

      // Verify dropdown is closed
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });

      // Refocus by clicking - this triggers onFocus which sets isOpen to true
      // Dropdown should reopen since inputValue is still 'กรุง' (>= 2) and suggestions exist
      fireEvent.focus(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });
  });

  describe('Outside Click', () => {
    it('closes dropdown when clicking outside', async () => {
      (useProvinceSearch as jest.Mock).mockReturnValue({
        query: 'กรุง',
        setQuery: mockSetQuery,
        suggestions: mockSuggestions,
        isLoading: false,
        error: null,
        clearSuggestions: mockClearSuggestions,
      });

      const user = userEvent.setup();
      render(
        <div>
          <ProvinceAutocomplete value={null} onChange={mockOnChange} />
          <button>Outside Button</button>
        </div>
      );

      const input = screen.getByRole('combobox');
      await user.type(input, 'กรุง');

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const outsideButton = screen.getByText('Outside Button');
      fireEvent.mouseDown(outsideButton);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('Input Changes', () => {
    it('calls setQuery when typing in input', async () => {
      const user = userEvent.setup();
      render(<ProvinceAutocomplete value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('combobox');
      await user.type(input, 'กรุง');

      expect(mockSetQuery).toHaveBeenCalledWith('กรุง');
    });

    it('calls onChange with null when input is cleared manually', async () => {
      const user = userEvent.setup();
      render(
        <ProvinceAutocomplete value={mockSuggestions[0]} onChange={mockOnChange} />
      );

      const input = screen.getByRole('combobox');
      await user.clear(input);

      expect(mockOnChange).toHaveBeenCalledWith(null);
    });

    it('updates input value when external value prop changes', () => {
      const { rerender } = render(
        <ProvinceAutocomplete value={null} onChange={mockOnChange} />
      );

      const input = screen.getByRole('combobox') as HTMLInputElement;
      expect(input.value).toBe('');

      rerender(
        <ProvinceAutocomplete value={mockSuggestions[0]} onChange={mockOnChange} />
      );

      expect(input.value).toBe('กรุงเทพมหานคร');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<ProvinceAutocomplete value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-label', 'ค้นหาจังหวัด');
      expect(input).toHaveAttribute('aria-expanded', 'false');
      expect(input).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('updates aria-expanded when dropdown opens', async () => {
      (useProvinceSearch as jest.Mock).mockReturnValue({
        query: 'กรุง',
        setQuery: mockSetQuery,
        suggestions: mockSuggestions,
        isLoading: false,
        error: null,
        clearSuggestions: mockClearSuggestions,
      });

      const user = userEvent.setup();
      render(<ProvinceAutocomplete value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('combobox');
      await user.type(input, 'กรุง');

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('has proper role attributes on dropdown elements', async () => {
      (useProvinceSearch as jest.Mock).mockReturnValue({
        query: 'กรุง',
        setQuery: mockSetQuery,
        suggestions: mockSuggestions,
        isLoading: false,
        error: null,
        clearSuggestions: mockClearSuggestions,
      });

      const user = userEvent.setup();
      render(<ProvinceAutocomplete value={null} onChange={mockOnChange} />);

      const input = screen.getByRole('combobox');
      await user.type(input, 'กรุง');

      await waitFor(() => {
        const listbox = screen.getByRole('listbox');
        expect(listbox).toBeInTheDocument();

        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(3);
      });
    });
  });
});
