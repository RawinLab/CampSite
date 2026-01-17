import { render, screen, fireEvent } from '@testing-library/react';
import { TypeBadge } from '@/components/ui/TypeBadge';

describe('TypeBadge Component', () => {
  it('renders badge with type name', () => {
    render(<TypeBadge name="Camping" colorHex="#22c55e" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Camping')).toBeInTheDocument();
  });

  it('Camping type has correct color (green)', () => {
    render(<TypeBadge name="Camping" colorHex="#22c55e" />);
    const badge = screen.getByRole('button');
    expect(badge).toHaveStyle({
      backgroundColor: '#22c55e20',
      color: '#22c55e',
      borderColor: '#22c55e',
    });
  });

  it('Glamping type has correct color (purple)', () => {
    render(<TypeBadge name="Glamping" colorHex="#a855f7" />);
    const badge = screen.getByRole('button');
    expect(badge).toHaveStyle({
      backgroundColor: '#a855f720',
      color: '#a855f7',
      borderColor: '#a855f7',
    });
  });

  it('Cabin type has correct color (brown)', () => {
    render(<TypeBadge name="Cabin" colorHex="#92400e" />);
    const badge = screen.getByRole('button');
    expect(badge).toHaveStyle({
      backgroundColor: '#92400e20',
      color: '#92400e',
      borderColor: '#92400e',
    });
  });

  it('RV Park type has correct color (blue)', () => {
    render(<TypeBadge name="RV Park" colorHex="#3b82f6" />);
    const badge = screen.getByRole('button');
    expect(badge).toHaveStyle({
      backgroundColor: '#3b82f620',
      color: '#3b82f6',
      borderColor: '#3b82f6',
    });
  });

  it('shows correct icon for tent type', () => {
    render(<TypeBadge name="Camping" colorHex="#22c55e" icon="tent" />);
    const badge = screen.getByRole('button');
    const svg = badge.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.querySelector('path[d="M3 21l9-18 9 18H3z"]')).toBeInTheDocument();
  });

  it('shows correct icon for star type', () => {
    render(<TypeBadge name="Glamping" colorHex="#a855f7" icon="star" />);
    const badge = screen.getByRole('button');
    const svg = badge.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.querySelector('polygon')).toBeInTheDocument();
  });

  it('shows correct icon for cabin type', () => {
    render(<TypeBadge name="Cabin" colorHex="#92400e" icon="cabin" />);
    const badge = screen.getByRole('button');
    const svg = badge.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.querySelector('path[d="M20 9v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9"]')).toBeInTheDocument();
  });

  it('shows correct icon for caravan type', () => {
    render(<TypeBadge name="RV Park" colorHex="#3b82f6" icon="caravan" />);
    const badge = screen.getByRole('button');
    const svg = badge.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.querySelector('rect')).toBeInTheDocument();
    expect(svg?.querySelector('circle')).toBeInTheDocument();
  });

  it('badge size sm works correctly', () => {
    render(<TypeBadge name="Camping" colorHex="#22c55e" size="sm" />);
    const badge = screen.getByRole('button');
    expect(badge).toHaveClass('px-2', 'py-1', 'text-xs', 'gap-1');
  });

  it('badge size md works correctly (default)', () => {
    render(<TypeBadge name="Camping" colorHex="#22c55e" size="md" />);
    const badge = screen.getByRole('button');
    expect(badge).toHaveClass('px-3', 'py-1.5', 'text-sm', 'gap-1.5');
  });

  it('badge size lg works correctly', () => {
    render(<TypeBadge name="Camping" colorHex="#22c55e" size="lg" />);
    const badge = screen.getByRole('button');
    expect(badge).toHaveClass('px-4', 'py-2', 'text-base', 'gap-2');
  });

  it('badge is accessible with proper role', () => {
    render(<TypeBadge name="Camping" colorHex="#22c55e" />);
    const badge = screen.getByRole('button');
    expect(badge).toHaveAttribute('type', 'button');
  });

  it('badge has proper aria-pressed attribute when selected', () => {
    render(<TypeBadge name="Camping" colorHex="#22c55e" selected={true} />);
    const badge = screen.getByRole('button');
    expect(badge).toHaveAttribute('aria-pressed', 'true');
  });

  it('badge has proper aria-pressed attribute when not selected', () => {
    render(<TypeBadge name="Camping" colorHex="#22c55e" selected={false} />);
    const badge = screen.getByRole('button');
    expect(badge).toHaveAttribute('aria-pressed', 'false');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<TypeBadge name="Camping" colorHex="#22c55e" onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies selected styles correctly', () => {
    render(<TypeBadge name="Camping" colorHex="#22c55e" selected={true} />);
    const badge = screen.getByRole('button');
    expect(badge).toHaveStyle({
      backgroundColor: '#22c55e',
      color: '#fff',
    });
    expect(badge).toHaveClass('ring-2', 'ring-offset-2');
  });

  it('applies hover classes when clickable', () => {
    const handleClick = jest.fn();
    render(<TypeBadge name="Camping" colorHex="#22c55e" onClick={handleClick} />);
    const badge = screen.getByRole('button');
    expect(badge).toHaveClass('cursor-pointer');
  });

  it('applies default cursor when not clickable', () => {
    render(<TypeBadge name="Camping" colorHex="#22c55e" />);
    const badge = screen.getByRole('button');
    expect(badge).toHaveClass('cursor-default');
  });

  it('applies custom className', () => {
    render(<TypeBadge name="Camping" colorHex="#22c55e" className="custom-class" />);
    const badge = screen.getByRole('button');
    expect(badge).toHaveClass('custom-class');
  });
});
