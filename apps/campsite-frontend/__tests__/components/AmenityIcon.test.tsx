import { render } from '@testing-library/react';
import { AmenityIcon } from '@/components/ui/AmenityIcon';

describe('AmenityIcon Component', () => {
  it('renders WiFi icon for wifi amenity', () => {
    const { container } = render(<AmenityIcon icon="wifi" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // WiFi icon has 4 paths/lines
    expect(svg?.querySelectorAll('path, line').length).toBeGreaterThanOrEqual(3);
  });

  it('renders Shower icon for shower amenity', () => {
    const { container } = render(<AmenityIcon icon="shower-head" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // Shower-head icon has multiple paths
    expect(svg?.querySelectorAll('path').length).toBeGreaterThan(1);
  });

  it('renders Electric icon for electricity amenity', () => {
    const { container } = render(<AmenityIcon icon="zap" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // Zap icon has a polygon
    expect(svg?.querySelector('polygon')).toBeInTheDocument();
  });

  it('renders Water icon for water amenity', () => {
    const { container } = render(<AmenityIcon icon="droplet" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // Droplet icon has a path
    expect(svg?.querySelector('path')).toBeInTheDocument();
  });

  it('renders Fire icon for fire-pit amenity', () => {
    const { container } = render(<AmenityIcon icon="flame" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // Flame icon has a path
    expect(svg?.querySelector('path')).toBeInTheDocument();
  });

  it('renders Toilet icon for restroom amenity', () => {
    const { container } = render(<AmenityIcon icon="door-closed" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // Door-closed icon has multiple paths
    expect(svg?.querySelectorAll('path').length).toBeGreaterThan(1);
  });

  it('renders Parking icon for parking amenity', () => {
    const { container } = render(<AmenityIcon icon="car" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // Car icon has paths and circles
    expect(svg?.querySelector('circle')).toBeInTheDocument();
  });

  it('renders Pet icon for pet-friendly amenity', () => {
    const { container } = render(<AmenityIcon icon="paw-print" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // Paw-print icon has circles
    expect(svg?.querySelectorAll('circle').length).toBeGreaterThan(1);
  });

  it('falls back to default icon for unknown amenity', () => {
    const { container } = render(<AmenityIcon icon="unknown-amenity" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // Default icon has a circle and paths
    expect(svg?.querySelector('circle')).toBeInTheDocument();
    expect(svg?.querySelectorAll('path').length).toBeGreaterThan(0);
  });

  it('size prop changes icon size', () => {
    const { container: containerSm } = render(<AmenityIcon icon="wifi" size="sm" />);
    const svgSm = containerSm.querySelector('svg');
    expect(svgSm).toHaveClass('h-4');
    expect(svgSm).toHaveClass('w-4');

    const { container: containerMd } = render(<AmenityIcon icon="wifi" size="md" />);
    const svgMd = containerMd.querySelector('svg');
    expect(svgMd).toHaveClass('h-5');
    expect(svgMd).toHaveClass('w-5');

    const { container: containerLg } = render(<AmenityIcon icon="wifi" size="lg" />);
    const svgLg = containerLg.querySelector('svg');
    expect(svgLg).toHaveClass('h-6');
    expect(svgLg).toHaveClass('w-6');
  });
});
