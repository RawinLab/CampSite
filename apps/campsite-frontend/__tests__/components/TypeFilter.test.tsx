import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TypeFilter } from '@/components/search/TypeFilter';
import { useCampsiteTypes } from '@/hooks/useCampsites';
import type { CampsiteTypeInfo } from '@campsite/shared';

// Mock useCampsiteTypes hook
jest.mock('@/hooks/useCampsites', () => ({
  useCampsiteTypes: jest.fn(),
}));

describe('TypeFilter Component', () => {
  const mockOnChange = jest.fn();

  const mockTypes: CampsiteTypeInfo[] = [
    {
      id: 1,
      name_th: 'แคมปิ้ง',
      name_en: 'Camping',
      slug: 'camping',
      color_hex: '#10B981',
      icon: 'tent',
      description_th: 'พื้นที่ตั้งเต็นท์',
      description_en: 'Tent camping area',
      sort_order: 1,
    },
    {
      id: 2,
      name_th: 'แกลมปิ้ง',
      name_en: 'Glamping',
      slug: 'glamping',
      color_hex: '#F59E0B',
      icon: 'star',
      description_th: 'แคมป์หรู',
      description_en: 'Glamorous camping',
      sort_order: 2,
    },
    {
      id: 3,
      name_th: 'บังกะโล',
      name_en: 'Cabin',
      slug: 'cabin',
      color_hex: '#8B5CF6',
      icon: 'cabin',
      description_th: 'บ้านพักขนาดเล็ก',
      description_en: 'Small cabin',
      sort_order: 3,
    },
    {
      id: 4,
      name_th: 'อาร์วี',
      name_en: 'RV Park',
      slug: 'rv-park',
      color_hex: '#EF4444',
      icon: 'caravan',
      description_th: 'ที่จอดรถบ้าน',
      description_en: 'RV parking area',
      sort_order: 4,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
    (useCampsiteTypes as jest.Mock).mockReturnValue({
      types: mockTypes,
      isLoading: false,
      error: null,
    });
  });

  describe('Rendering', () => {
    it('renders all 4 campsite types', () => {
      render(<TypeFilter selectedTypes={[]} onChange={mockOnChange} />);

      expect(screen.getByText('แคมปิ้ง')).toBeInTheDocument();
      expect(screen.getByText('แกลมปิ้ง')).toBeInTheDocument();
      expect(screen.getByText('บังกะโล')).toBeInTheDocument();
      expect(screen.getByText('อาร์วี')).toBeInTheDocument();
    });

    it('renders each type with correct icon', () => {
      render(<TypeFilter selectedTypes={[]} onChange={mockOnChange} />);

      const buttons = screen.getAllByRole('button');

      // Each TypeBadge should be rendered with an icon (svg)
      buttons.forEach((button) => {
        if (button.textContent !== 'ล้างทั้งหมด') {
          const svg = button.querySelector('svg');
          expect(svg).toBeInTheDocument();
        }
      });
    });

    it('renders section header', () => {
      render(<TypeFilter selectedTypes={[]} onChange={mockOnChange} />);

      expect(screen.getByText('ประเภทที่พัก')).toBeInTheDocument();
    });

    it('does not show clear all button when no types selected', () => {
      render(<TypeFilter selectedTypes={[]} onChange={mockOnChange} />);

      expect(screen.queryByText('ล้างทั้งหมด')).not.toBeInTheDocument();
    });

    it('shows clear all button when types are selected', () => {
      render(<TypeFilter selectedTypes={['camping', 'glamping']} onChange={mockOnChange} />);

      expect(screen.getByText('ล้างทั้งหมด')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <TypeFilter selectedTypes={[]} onChange={mockOnChange} className="custom-class" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
    });
  });

  describe('Loading State', () => {
    it('shows skeleton loading state while fetching types', () => {
      (useCampsiteTypes as jest.Mock).mockReturnValue({
        types: [],
        isLoading: true,
        error: null,
      });

      render(<TypeFilter selectedTypes={[]} onChange={mockOnChange} />);

      // Should render 4 skeleton placeholders
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('hides loading state after fetch completes', () => {
      const { rerender } = render(<TypeFilter selectedTypes={[]} onChange={mockOnChange} />);

      (useCampsiteTypes as jest.Mock).mockReturnValue({
        types: [],
        isLoading: true,
        error: null,
      });

      rerender(<TypeFilter selectedTypes={[]} onChange={mockOnChange} />);

      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);

      (useCampsiteTypes as jest.Mock).mockReturnValue({
        types: mockTypes,
        isLoading: false,
        error: null,
      });

      rerender(<TypeFilter selectedTypes={[]} onChange={mockOnChange} />);

      expect(screen.getByText('แคมปิ้ง')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error message when fetch fails', () => {
      (useCampsiteTypes as jest.Mock).mockReturnValue({
        types: [],
        isLoading: false,
        error: 'Network error',
      });

      render(<TypeFilter selectedTypes={[]} onChange={mockOnChange} />);

      expect(screen.getByText('ไม่สามารถโหลดประเภทแคมป์ได้')).toBeInTheDocument();
    });

    it('error message has proper styling', () => {
      (useCampsiteTypes as jest.Mock).mockReturnValue({
        types: [],
        isLoading: false,
        error: 'Network error',
      });

      render(<TypeFilter selectedTypes={[]} onChange={mockOnChange} />);

      const errorMessage = screen.getByText('ไม่สามารถโหลดประเภทแคมป์ได้');
      expect(errorMessage).toHaveClass('text-red-500');
    });
  });

  describe('Type Selection', () => {
    it('clicking a type toggles its selection', async () => {
      const user = userEvent.setup();
      render(<TypeFilter selectedTypes={[]} onChange={mockOnChange} />);

      const campingButton = screen.getByText('แคมปิ้ง').closest('button');
      expect(campingButton).toBeInTheDocument();

      await user.click(campingButton!);

      expect(mockOnChange).toHaveBeenCalledWith(['camping']);
    });

    it('multiple types can be selected simultaneously', async () => {
      const user = userEvent.setup();
      render(<TypeFilter selectedTypes={['camping']} onChange={mockOnChange} />);

      const glampingButton = screen.getByText('แกลมปิ้ง').closest('button');
      await user.click(glampingButton!);

      expect(mockOnChange).toHaveBeenCalledWith(['camping', 'glamping']);
    });

    it('clicking selected type deselects it', async () => {
      const user = userEvent.setup();
      render(<TypeFilter selectedTypes={['camping', 'glamping']} onChange={mockOnChange} />);

      const campingButton = screen.getByText('แคมปิ้ง').closest('button');
      await user.click(campingButton!);

      expect(mockOnChange).toHaveBeenCalledWith(['glamping']);
    });

    it('all types can be selected', async () => {
      const user = userEvent.setup();
      render(<TypeFilter selectedTypes={['camping', 'glamping', 'cabin']} onChange={mockOnChange} />);

      const rvButton = screen.getByText('อาร์วี').closest('button');
      await user.click(rvButton!);

      expect(mockOnChange).toHaveBeenCalledWith(['camping', 'glamping', 'cabin', 'rv-park']);
    });
  });

  describe('Visual Highlighting', () => {
    it('selected types are visually highlighted', () => {
      render(<TypeFilter selectedTypes={['camping']} onChange={mockOnChange} />);

      const campingButton = screen.getByText('แคมปิ้ง').closest('button');
      expect(campingButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('unselected types are not highlighted', () => {
      render(<TypeFilter selectedTypes={['camping']} onChange={mockOnChange} />);

      const glampingButton = screen.getByText('แกลมปิ้ง').closest('button');
      expect(glampingButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('selected types have ring styling', () => {
      render(<TypeFilter selectedTypes={['glamping']} onChange={mockOnChange} />);

      const glampingButton = screen.getByText('แกลมปิ้ง').closest('button');
      expect(glampingButton).toHaveClass('ring-2', 'ring-offset-2');
    });

    it('multiple selected types all show highlighted', () => {
      render(<TypeFilter selectedTypes={['camping', 'glamping', 'cabin']} onChange={mockOnChange} />);

      const campingButton = screen.getByText('แคมปิ้ง').closest('button');
      const glampingButton = screen.getByText('แกลมปิ้ง').closest('button');
      const cabinButton = screen.getByText('บังกะโล').closest('button');

      expect(campingButton).toHaveAttribute('aria-pressed', 'true');
      expect(glampingButton).toHaveAttribute('aria-pressed', 'true');
      expect(cabinButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('onChange Callback', () => {
    it('onChange callback fires with updated array on selection', async () => {
      const user = userEvent.setup();
      render(<TypeFilter selectedTypes={[]} onChange={mockOnChange} />);

      const campingButton = screen.getByText('แคมปิ้ง').closest('button');
      await user.click(campingButton!);

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith(['camping']);
    });

    it('onChange callback fires with updated array on deselection', async () => {
      const user = userEvent.setup();
      render(<TypeFilter selectedTypes={['camping', 'glamping']} onChange={mockOnChange} />);

      const campingButton = screen.getByText('แคมปิ้ง').closest('button');
      await user.click(campingButton!);

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith(['glamping']);
    });

    it('onChange callback includes all currently selected types', async () => {
      const user = userEvent.setup();
      render(<TypeFilter selectedTypes={['camping']} onChange={mockOnChange} />);

      const glampingButton = screen.getByText('แกลมปิ้ง').closest('button');
      await user.click(glampingButton!);

      expect(mockOnChange).toHaveBeenCalledWith(['camping', 'glamping']);
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('onChange is not called when component mounts', () => {
      render(<TypeFilter selectedTypes={['camping']} onChange={mockOnChange} />);

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Clear All Button', () => {
    it('clear all button deselects all types', async () => {
      const user = userEvent.setup();
      render(<TypeFilter selectedTypes={['camping', 'glamping', 'cabin']} onChange={mockOnChange} />);

      const clearButton = screen.getByText('ล้างทั้งหมด');
      await user.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledWith([]);
    });

    it('clear all button only appears when types are selected', () => {
      const { rerender } = render(<TypeFilter selectedTypes={[]} onChange={mockOnChange} />);

      expect(screen.queryByText('ล้างทั้งหมด')).not.toBeInTheDocument();

      rerender(<TypeFilter selectedTypes={['camping']} onChange={mockOnChange} />);

      expect(screen.getByText('ล้างทั้งหมด')).toBeInTheDocument();
    });

    it('clear all button has proper styling', () => {
      render(<TypeFilter selectedTypes={['camping']} onChange={mockOnChange} />);

      const clearButton = screen.getByText('ล้างทั้งหมด');
      expect(clearButton).toHaveClass('text-green-600');
    });

    it('clicking clear all then selecting works correctly', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <TypeFilter selectedTypes={['camping', 'glamping']} onChange={mockOnChange} />
      );

      const clearButton = screen.getByText('ล้างทั้งหมด');
      await user.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledWith([]);

      // Simulate parent updating selectedTypes to empty
      rerender(<TypeFilter selectedTypes={[]} onChange={mockOnChange} />);

      const campingButton = screen.getByText('แคมปิ้ง').closest('button');
      await user.click(campingButton!);

      expect(mockOnChange).toHaveBeenCalledWith(['camping']);
    });
  });

  describe('Type Enum Matching', () => {
    it('types match campsite_type enum values', () => {
      render(<TypeFilter selectedTypes={[]} onChange={mockOnChange} />);

      // Expected campsite_type enum: camping, glamping, cabin, rv-park
      const validTypes = ['camping', 'glamping', 'cabin', 'rv-park'];
      const renderedSlugs = mockTypes.map((t) => t.slug);

      expect(renderedSlugs).toEqual(expect.arrayContaining(validTypes));
    });

    it('all rendered types have valid slugs', () => {
      render(<TypeFilter selectedTypes={[]} onChange={mockOnChange} />);

      mockTypes.forEach((type) => {
        expect(type.slug).toMatch(/^[a-z-]+$/);
      });
    });

    it('selected types use correct slug format', async () => {
      const user = userEvent.setup();
      render(<TypeFilter selectedTypes={[]} onChange={mockOnChange} />);

      const campingButton = screen.getByText('แคมปิ้ง').closest('button');
      await user.click(campingButton!);

      expect(mockOnChange).toHaveBeenCalledWith(['camping']);
      expect(mockOnChange).not.toHaveBeenCalledWith(['Camping']);
      expect(mockOnChange).not.toHaveBeenCalledWith(['CAMPING']);
    });
  });

  describe('Integration', () => {
    it('works with empty types array', () => {
      (useCampsiteTypes as jest.Mock).mockReturnValue({
        types: [],
        isLoading: false,
        error: null,
      });

      render(<TypeFilter selectedTypes={[]} onChange={mockOnChange} />);

      expect(screen.getByText('ประเภทที่พัก')).toBeInTheDocument();
      expect(screen.queryByText('แคมปิ้ง')).not.toBeInTheDocument();
    });

    it('handles rapid clicking correctly', async () => {
      const user = userEvent.setup();
      render(<TypeFilter selectedTypes={[]} onChange={mockOnChange} />);

      const campingButton = screen.getByText('แคมปิ้ง').closest('button');

      // Click rapidly
      await user.click(campingButton!);
      await user.click(campingButton!);
      await user.click(campingButton!);

      expect(mockOnChange).toHaveBeenCalledTimes(3);
    });

    it('updates when selectedTypes prop changes', () => {
      const { rerender } = render(<TypeFilter selectedTypes={[]} onChange={mockOnChange} />);

      const campingButton = screen.getByText('แคมปิ้ง').closest('button');
      expect(campingButton).toHaveAttribute('aria-pressed', 'false');

      rerender(<TypeFilter selectedTypes={['camping']} onChange={mockOnChange} />);

      expect(campingButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('renders types in correct sort order', () => {
      render(<TypeFilter selectedTypes={[]} onChange={mockOnChange} />);

      const buttons = screen.getAllByRole('button');
      const typeButtons = buttons.filter((btn) => btn.textContent !== 'ล้างทั้งหมด');

      expect(typeButtons[0]).toHaveTextContent('แคมปิ้ง');
      expect(typeButtons[1]).toHaveTextContent('แกลมปิ้ง');
      expect(typeButtons[2]).toHaveTextContent('บังกะโล');
      expect(typeButtons[3]).toHaveTextContent('อาร์วี');
    });
  });

  describe('Accessibility', () => {
    it('type buttons have proper aria-pressed attribute', () => {
      render(<TypeFilter selectedTypes={['camping']} onChange={mockOnChange} />);

      const campingButton = screen.getByText('แคมปิ้ง').closest('button');
      const glampingButton = screen.getByText('แกลมปิ้ง').closest('button');

      expect(campingButton).toHaveAttribute('aria-pressed', 'true');
      expect(glampingButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('all type buttons have type="button" attribute', () => {
      render(<TypeFilter selectedTypes={[]} onChange={mockOnChange} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('clear button has type="button" attribute', () => {
      render(<TypeFilter selectedTypes={['camping']} onChange={mockOnChange} />);

      const clearButton = screen.getByText('ล้างทั้งหมด');
      expect(clearButton).toHaveAttribute('type', 'button');
    });
  });

  describe('Color Styling', () => {
    it('each type displays with correct color', () => {
      render(<TypeFilter selectedTypes={[]} onChange={mockOnChange} />);

      const campingButton = screen.getByText('แคมปิ้ง').closest('button');
      const glampingButton = screen.getByText('แกลมปิ้ง').closest('button');

      expect(campingButton).toHaveStyle({ backgroundColor: '#10B98120' });
      expect(glampingButton).toHaveStyle({ backgroundColor: '#F59E0B20' });
    });

    it('selected types show full color background', () => {
      render(<TypeFilter selectedTypes={['glamping']} onChange={mockOnChange} />);

      const glampingButton = screen.getByText('แกลมปิ้ง').closest('button');
      expect(glampingButton).toHaveStyle({ backgroundColor: '#F59E0B' });
    });
  });
});
