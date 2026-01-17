import { render, screen } from '@testing-library/react';
import { WishlistEmpty } from '@/components/wishlist/WishlistEmpty';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>;
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Heart: ({ className, strokeWidth }: { className?: string; strokeWidth?: number }) => (
    <svg className={className} data-testid="heart-icon" data-stroke-width={strokeWidth} />
  ),
  Search: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="search-icon" />
  ),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    variant,
    asChild,
  }: {
    children: React.ReactNode;
    variant?: string;
    asChild?: boolean;
  }) => (
    <div data-component="button" data-variant={variant} data-as-child={asChild}>
      {children}
    </div>
  ),
}));

describe('WishlistEmpty', () => {
  describe('Rendering Empty State Message', () => {
    it('renders empty state heading', () => {
      render(<WishlistEmpty />);

      expect(screen.getByText('Your wishlist is empty')).toBeInTheDocument();
    });

    it('renders heading as h2', () => {
      const { container } = render(<WishlistEmpty />);

      const heading = container.querySelector('h2');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Your wishlist is empty');
    });

    it('renders descriptive text about the wishlist', () => {
      render(<WishlistEmpty />);

      expect(
        screen.getByText(
          /Start exploring campsites and tap the heart icon to save your favorites/
        )
      ).toBeInTheDocument();
    });

    it('renders secondary descriptive text', () => {
      render(<WishlistEmpty />);

      expect(
        screen.getByText(/Your saved campsites will appear here/)
      ).toBeInTheDocument();
    });

    it('applies correct styling to heading', () => {
      const { container } = render(<WishlistEmpty />);

      const heading = container.querySelector('h2');
      expect(heading).toHaveClass('mb-2', 'text-xl', 'font-semibold', 'text-gray-900');
    });

    it('applies correct styling to description text', () => {
      const { container } = render(<WishlistEmpty />);

      const description = container.querySelector('p');
      expect(description).toHaveClass('mb-6', 'max-w-md', 'text-center', 'text-gray-500');
    });
  });

  describe('Icon/Illustration Display', () => {
    it('renders heart icon', () => {
      render(<WishlistEmpty />);

      const heartIcons = screen.getAllByTestId('heart-icon');
      expect(heartIcons.length).toBeGreaterThan(0);
    });

    it('renders multiple heart icons for layered effect', () => {
      render(<WishlistEmpty />);

      const heartIcons = screen.getAllByTestId('heart-icon');
      expect(heartIcons.length).toBe(2);
    });

    it('applies correct size classes to heart icons', () => {
      render(<WishlistEmpty />);

      const heartIcons = screen.getAllByTestId('heart-icon');
      heartIcons.forEach((icon) => {
        expect(icon).toHaveClass('h-24', 'w-24');
      });
    });

    it('applies different colors to layered heart icons', () => {
      render(<WishlistEmpty />);

      const heartIcons = screen.getAllByTestId('heart-icon');
      expect(heartIcons[0]).toHaveClass('text-gray-200');
      expect(heartIcons[1]).toHaveClass('text-gray-300');
    });

    it('applies thin stroke width to heart icons', () => {
      render(<WishlistEmpty />);

      const heartIcons = screen.getAllByTestId('heart-icon');
      heartIcons.forEach((icon) => {
        expect(icon).toHaveAttribute('data-stroke-width', '1');
      });
    });

    it('positions second heart icon absolutely', () => {
      const { container } = render(<WishlistEmpty />);

      const heartIcons = screen.getAllByTestId('heart-icon');
      const absoluteIcon = heartIcons[1];
      expect(absoluteIcon).toHaveClass('absolute', 'inset-0');
    });

    it('wraps heart icons in relative container', () => {
      const { container } = render(<WishlistEmpty />);

      const iconContainer = container.querySelector('.relative');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveClass('mb-6');
    });
  });

  describe('Browse Campsites Link', () => {
    it('renders explore campsites link', () => {
      render(<WishlistEmpty />);

      const link = screen.getByText('Explore Campsites');
      expect(link).toBeInTheDocument();
    });

    it('links to search page', () => {
      render(<WishlistEmpty />);

      const link = screen.getByText('Explore Campsites').closest('a');
      expect(link).toHaveAttribute('href', '/search');
    });

    it('displays search icon in explore button', () => {
      render(<WishlistEmpty />);

      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    it('renders homepage link', () => {
      render(<WishlistEmpty />);

      const link = screen.getByText('View Homepage');
      expect(link).toBeInTheDocument();
    });

    it('links to homepage', () => {
      render(<WishlistEmpty />);

      const link = screen.getByText('View Homepage').closest('a');
      expect(link).toHaveAttribute('href', '/');
    });

    it('renders explore button as primary variant', () => {
      const { container } = render(<WishlistEmpty />);

      const buttons = container.querySelectorAll('[data-component="button"]');
      const exploreButton = Array.from(buttons).find((btn) =>
        btn.textContent?.includes('Explore Campsites')
      );
      expect(exploreButton).not.toHaveAttribute('data-variant');
    });

    it('renders homepage button as outline variant', () => {
      const { container } = render(<WishlistEmpty />);

      const buttons = container.querySelectorAll('[data-component="button"]');
      const homepageButton = Array.from(buttons).find((btn) =>
        btn.textContent?.includes('View Homepage')
      );
      expect(homepageButton).toHaveAttribute('data-variant', 'outline');
    });

    it('renders buttons with asChild prop', () => {
      const { container } = render(<WishlistEmpty />);

      const buttons = container.querySelectorAll('[data-component="button"]');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('data-as-child', 'true');
      });
    });
  });

  describe('Accessibility Attributes', () => {
    it('uses semantic heading for empty state title', () => {
      const { container } = render(<WishlistEmpty />);

      const heading = container.querySelector('h2');
      expect(heading?.tagName).toBe('H2');
    });

    it('provides meaningful text for screen readers', () => {
      render(<WishlistEmpty />);

      expect(screen.getByText('Your wishlist is empty')).toBeInTheDocument();
      expect(
        screen.getByText(/Start exploring campsites/)
      ).toBeInTheDocument();
    });

    it('renders all interactive elements as links', () => {
      render(<WishlistEmpty />);

      const links = screen.getAllByRole('link');
      expect(links.length).toBe(2);
    });

    it('provides clear link text for navigation', () => {
      render(<WishlistEmpty />);

      expect(screen.getByText('Explore Campsites')).toBeInTheDocument();
      expect(screen.getByText('View Homepage')).toBeInTheDocument();
    });

    it('centers content for better visual hierarchy', () => {
      const { container } = render(<WishlistEmpty />);

      const mainContainer = container.querySelector('.flex');
      expect(mainContainer).toHaveClass('flex-col', 'items-center', 'justify-center');
    });
  });

  describe('Layout and Styling', () => {
    it('applies consistent padding to container', () => {
      const { container } = render(<WishlistEmpty />);

      const mainContainer = container.querySelector('.flex');
      expect(mainContainer).toHaveClass('py-16', 'px-4');
    });

    it('applies correct button layout on mobile', () => {
      const { container } = render(<WishlistEmpty />);

      const buttonContainer = container.querySelector('.flex.flex-col.gap-3');
      expect(buttonContainer).toBeInTheDocument();
    });

    it('applies responsive layout for buttons', () => {
      const { container } = render(<WishlistEmpty />);

      const buttonContainer = container.querySelector('.flex.flex-col.gap-3');
      expect(buttonContainer).toHaveClass('sm:flex-row');
    });

    it('applies margin to description paragraph', () => {
      const { container } = render(<WishlistEmpty />);

      const description = container.querySelector('p');
      expect(description).toHaveClass('mb-6');
    });

    it('centers text content', () => {
      const { container } = render(<WishlistEmpty />);

      const description = container.querySelector('p');
      expect(description).toHaveClass('text-center');
    });

    it('constrains description width', () => {
      const { container } = render(<WishlistEmpty />);

      const description = container.querySelector('p');
      expect(description).toHaveClass('max-w-md');
    });
  });

  describe('Client Component', () => {
    it('renders without errors', () => {
      expect(() => render(<WishlistEmpty />)).not.toThrow();
    });

    it('renders all expected sections', () => {
      const { container } = render(<WishlistEmpty />);

      // Icon section
      expect(screen.getAllByTestId('heart-icon').length).toBe(2);

      // Text section
      expect(screen.getByText('Your wishlist is empty')).toBeInTheDocument();

      // Button section
      expect(screen.getByText('Explore Campsites')).toBeInTheDocument();
      expect(screen.getByText('View Homepage')).toBeInTheDocument();
    });
  });
});
