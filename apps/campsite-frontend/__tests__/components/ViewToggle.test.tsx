import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ViewToggle } from '@/components/search/ViewToggle';

describe('ViewToggle Component', () => {
  const mockOnViewChange = jest.fn();

  beforeEach(() => {
    mockOnViewChange.mockClear();
  });

  describe('Rendering behavior', () => {
    it('renders list and map view buttons', () => {
      render(<ViewToggle view="list" onViewChange={mockOnViewChange} />);

      expect(screen.getByRole('button', { name: /list/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /map/i })).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(
        <ViewToggle view="list" onViewChange={mockOnViewChange} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
      expect(container.firstChild).toHaveClass('view-toggle');
    });

    it('displays list count when provided and list view is active', () => {
      render(<ViewToggle view="list" onViewChange={mockOnViewChange} listCount={42} />);

      expect(screen.getByText('(42)')).toBeInTheDocument();
    });

    it('does not display list count when map view is active', () => {
      render(<ViewToggle view="map" onViewChange={mockOnViewChange} listCount={42} />);

      expect(screen.queryByText('(42)')).not.toBeInTheDocument();
    });

    it('does not display list count when not provided', () => {
      render(<ViewToggle view="list" onViewChange={mockOnViewChange} />);

      expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
    });
  });

  describe('Default view state', () => {
    it('list view is selected by default when view prop is "list"', () => {
      render(<ViewToggle view="list" onViewChange={mockOnViewChange} />);

      const listButton = screen.getByRole('button', { name: /list/i });
      const mapButton = screen.getByRole('button', { name: /map/i });

      expect(listButton).toHaveClass('view-toggle__button--active');
      expect(mapButton).not.toHaveClass('view-toggle__button--active');
    });

    it('map view is selected when view prop is "map"', () => {
      render(<ViewToggle view="map" onViewChange={mockOnViewChange} />);

      const listButton = screen.getByRole('button', { name: /list/i });
      const mapButton = screen.getByRole('button', { name: /map/i });

      expect(mapButton).toHaveClass('view-toggle__button--active');
      expect(listButton).not.toHaveClass('view-toggle__button--active');
    });
  });

  describe('Button interactions', () => {
    it('clicking map button triggers onChange with "map"', async () => {
      const user = userEvent.setup();
      render(<ViewToggle view="list" onViewChange={mockOnViewChange} />);

      const mapButton = screen.getByRole('button', { name: /map/i });
      await user.click(mapButton);

      expect(mockOnViewChange).toHaveBeenCalledTimes(1);
      expect(mockOnViewChange).toHaveBeenCalledWith('map');
    });

    it('clicking list button triggers onChange with "list"', async () => {
      const user = userEvent.setup();
      render(<ViewToggle view="map" onViewChange={mockOnViewChange} />);

      const listButton = screen.getByRole('button', { name: /list/i });
      await user.click(listButton);

      expect(mockOnViewChange).toHaveBeenCalledTimes(1);
      expect(mockOnViewChange).toHaveBeenCalledWith('list');
    });

    it('clicking active button still triggers onChange', async () => {
      const user = userEvent.setup();
      render(<ViewToggle view="list" onViewChange={mockOnViewChange} />);

      const listButton = screen.getByRole('button', { name: /list/i });
      await user.click(listButton);

      expect(mockOnViewChange).toHaveBeenCalledTimes(1);
      expect(mockOnViewChange).toHaveBeenCalledWith('list');
    });

    it('multiple clicks trigger multiple onChange calls', async () => {
      const user = userEvent.setup();
      render(<ViewToggle view="list" onViewChange={mockOnViewChange} />);

      const mapButton = screen.getByRole('button', { name: /map/i });
      const listButton = screen.getByRole('button', { name: /list/i });

      await user.click(mapButton);
      await user.click(listButton);
      await user.click(mapButton);

      expect(mockOnViewChange).toHaveBeenCalledTimes(3);
      expect(mockOnViewChange).toHaveBeenNthCalledWith(1, 'map');
      expect(mockOnViewChange).toHaveBeenNthCalledWith(2, 'list');
      expect(mockOnViewChange).toHaveBeenNthCalledWith(3, 'map');
    });
  });

  describe('Active button styling', () => {
    it('active button has correct styling class', () => {
      const { rerender } = render(<ViewToggle view="list" onViewChange={mockOnViewChange} />);

      const listButton = screen.getByRole('button', { name: /list/i });
      const mapButton = screen.getByRole('button', { name: /map/i });

      expect(listButton).toHaveClass('view-toggle__button--active');
      expect(mapButton).not.toHaveClass('view-toggle__button--active');

      // Rerender with map view active
      rerender(<ViewToggle view="map" onViewChange={mockOnViewChange} />);

      expect(mapButton).toHaveClass('view-toggle__button--active');
      expect(listButton).not.toHaveClass('view-toggle__button--active');
    });

    it('both buttons have base class', () => {
      render(<ViewToggle view="list" onViewChange={mockOnViewChange} />);

      const listButton = screen.getByRole('button', { name: /list/i });
      const mapButton = screen.getByRole('button', { name: /map/i });

      expect(listButton).toHaveClass('view-toggle__button');
      expect(mapButton).toHaveClass('view-toggle__button');
    });
  });

  describe('Accessibility', () => {
    it('buttons have proper aria-pressed attributes', () => {
      render(<ViewToggle view="list" onViewChange={mockOnViewChange} />);

      const listButton = screen.getByRole('button', { name: /list/i });
      const mapButton = screen.getByRole('button', { name: /map/i });

      expect(listButton).toHaveAttribute('aria-pressed', 'true');
      expect(mapButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('aria-pressed updates when view changes', () => {
      const { rerender } = render(<ViewToggle view="list" onViewChange={mockOnViewChange} />);

      const listButton = screen.getByRole('button', { name: /list/i });
      const mapButton = screen.getByRole('button', { name: /map/i });

      expect(listButton).toHaveAttribute('aria-pressed', 'true');
      expect(mapButton).toHaveAttribute('aria-pressed', 'false');

      // Rerender with map view
      rerender(<ViewToggle view="map" onViewChange={mockOnViewChange} />);

      expect(listButton).toHaveAttribute('aria-pressed', 'false');
      expect(mapButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('buttons have type="button" to prevent form submission', () => {
      render(<ViewToggle view="list" onViewChange={mockOnViewChange} />);

      const listButton = screen.getByRole('button', { name: /list/i });
      const mapButton = screen.getByRole('button', { name: /map/i });

      expect(listButton).toHaveAttribute('type', 'button');
      expect(mapButton).toHaveAttribute('type', 'button');
    });

    it('buttons are keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<ViewToggle view="list" onViewChange={mockOnViewChange} />);

      const mapButton = screen.getByRole('button', { name: /map/i });

      // Focus and press Enter
      mapButton.focus();
      await user.keyboard('{Enter}');

      expect(mockOnViewChange).toHaveBeenCalledWith('map');

      mockOnViewChange.mockClear();

      // Press Space
      await user.keyboard(' ');

      expect(mockOnViewChange).toHaveBeenCalledWith('map');
    });
  });

  describe('SVG icons', () => {
    it('renders list icon in list button', () => {
      const { container } = render(<ViewToggle view="list" onViewChange={mockOnViewChange} />);

      const listButton = screen.getByRole('button', { name: /list/i });
      const listIcon = listButton.querySelector('svg');

      expect(listIcon).toBeInTheDocument();
      expect(listIcon).toHaveAttribute('width', '18');
      expect(listIcon).toHaveAttribute('height', '18');
    });

    it('renders map icon in map button', () => {
      const { container } = render(<ViewToggle view="list" onViewChange={mockOnViewChange} />);

      const mapButton = screen.getByRole('button', { name: /map/i });
      const mapIcon = mapButton.querySelector('svg');

      expect(mapIcon).toBeInTheDocument();
      expect(mapIcon).toHaveAttribute('width', '18');
      expect(mapIcon).toHaveAttribute('height', '18');
    });
  });

  describe('Edge cases', () => {
    it('handles rapid successive clicks', async () => {
      const user = userEvent.setup();
      render(<ViewToggle view="list" onViewChange={mockOnViewChange} />);

      const mapButton = screen.getByRole('button', { name: /map/i });

      // Rapid clicks
      await user.click(mapButton);
      await user.click(mapButton);
      await user.click(mapButton);

      expect(mockOnViewChange).toHaveBeenCalledTimes(3);
      expect(mockOnViewChange).toHaveBeenCalledWith('map');
    });

    it('handles listCount of 0', () => {
      render(<ViewToggle view="list" onViewChange={mockOnViewChange} listCount={0} />);

      expect(screen.getByText('(0)')).toBeInTheDocument();
    });

    it('handles very large listCount', () => {
      render(<ViewToggle view="list" onViewChange={mockOnViewChange} listCount={999999} />);

      expect(screen.getByText('(999999)')).toBeInTheDocument();
    });
  });
});
