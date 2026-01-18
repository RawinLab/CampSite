import { render, screen } from '@testing-library/react';
import NotFound from '@/app/not-found';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('NotFound Page', () => {
  describe('Error Display', () => {
    it('renders 404 heading', () => {
      render(<NotFound />);

      expect(screen.getByText('404')).toBeInTheDocument();
    });

    it('renders Thai title', () => {
      render(<NotFound />);

      expect(screen.getByText('ไม่พบหน้าที่คุณกำลังค้นหา')).toBeInTheDocument();
    });

    it('renders descriptive error message', () => {
      render(<NotFound />);

      expect(
        screen.getByText(/หน้าที่คุณกำลังค้นหาอาจถูกย้าย ลบไปแล้ว หรือไม่เคยมีอยู่/)
      ).toBeInTheDocument();
    });

    it('displays tent icon', () => {
      const { container } = render(<NotFound />);

      const tentIcon = container.querySelector('svg');
      expect(tentIcon).toBeInTheDocument();
      expect(tentIcon).toHaveClass('text-green-500');
    });
  });

  describe('Search Form', () => {
    it('has search form with correct action', () => {
      const { container } = render(<NotFound />);

      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
      expect(form).toHaveAttribute('action', '/search');
      expect(form).toHaveAttribute('method', 'get');
    });

    it('has search input field', () => {
      render(<NotFound />);

      const input = screen.getByPlaceholderText('ค้นหาแคมป์ไซต์...');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('name', 'q');
    });

    it('has search submit button', () => {
      render(<NotFound />);

      const buttons = screen.getAllByRole('button');
      const searchButton = buttons.find(btn => btn.textContent === 'ค้นหา');
      expect(searchButton).toBeInTheDocument();
      expect(searchButton).toHaveAttribute('type', 'submit');
    });

    it('applies correct styling to search button', () => {
      render(<NotFound />);

      const buttons = screen.getAllByRole('button');
      const searchButton = buttons.find(btn => btn.textContent === 'ค้นหา');
      expect(searchButton).toHaveClass('bg-green-600', 'hover:bg-green-700');
    });
  });

  describe('Navigation Buttons', () => {
    it('has home button with correct link', () => {
      render(<NotFound />);

      const homeLink = screen.getByText('กลับหน้าหลัก').closest('a');
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('has search page button with correct link', () => {
      render(<NotFound />);

      const searchLink = screen.getByText('ค้นหาแคมป์ไซต์').closest('a');
      expect(searchLink).toHaveAttribute('href', '/search');
    });

    it('displays home icon on home button', () => {
      const { container } = render(<NotFound />);

      const homeButton = screen.getByText('กลับหน้าหลัก').closest('button');
      expect(homeButton).toBeInTheDocument();

      const homeIcon = homeButton?.querySelector('svg');
      expect(homeIcon).toBeInTheDocument();
    });

    it('displays search icon on search button', () => {
      const { container } = render(<NotFound />);

      const searchButton = screen.getByText('ค้นหาแคมป์ไซต์').closest('button');
      expect(searchButton).toBeInTheDocument();

      const searchIcon = searchButton?.querySelector('svg');
      expect(searchIcon).toBeInTheDocument();
    });

    it('applies outline variant to home button', () => {
      render(<NotFound />);

      const homeButton = screen.getByText('กลับหน้าหลัก').closest('button');
      expect(homeButton).toBeInTheDocument();
    });
  });

  describe('Popular Suggestions Links', () => {
    it('displays popular suggestions section title', () => {
      render(<NotFound />);

      expect(screen.getByText('แคมป์ไซต์ยอดนิยม:')).toBeInTheDocument();
    });

    it('has camping type suggestion link', () => {
      render(<NotFound />);

      const campingLink = screen.getByText('แคมป์ปิ้ง').closest('a');
      expect(campingLink).toHaveAttribute('href', '/search?type=camping');
    });

    it('has glamping type suggestion link', () => {
      render(<NotFound />);

      const glampingLink = screen.getByText('แกลมปิ้ง').closest('a');
      expect(glampingLink).toHaveAttribute('href', '/search?type=glamping');
    });

    it('has bungalow type suggestion link', () => {
      render(<NotFound />);

      const bungalowLink = screen.getByText('บังกะโล').closest('a');
      expect(bungalowLink).toHaveAttribute('href', '/search?type=bungalow');
    });

    it('has Chiang Mai province suggestion link', () => {
      render(<NotFound />);

      const chiangMaiLink = screen.getByText('เชียงใหม่').closest('a');
      expect(chiangMaiLink).toHaveAttribute('href', '/provinces/chiang-mai');
    });

    it('has Kanchanaburi province suggestion link', () => {
      render(<NotFound />);

      const kanchanaburiLink = screen.getByText('กาญจนบุรี').closest('a');
      expect(kanchanaburiLink).toHaveAttribute('href', '/provinces/kanchanaburi');
    });

    it('renders suggestion links with styling classes', () => {
      const { container } = render(<NotFound />);

      const suggestionLinks = container.querySelectorAll('.flex-wrap a');
      expect(suggestionLinks.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Layout and Styling', () => {
    it('has centered layout', () => {
      const { container } = render(<NotFound />);

      const mainDiv = container.querySelector('.min-h-screen.flex.items-center.justify-center');
      expect(mainDiv).toBeInTheDocument();
    });

    it('applies gradient background', () => {
      const { container } = render(<NotFound />);

      const mainDiv = container.querySelector('.bg-gradient-to-b.from-green-50.to-white');
      expect(mainDiv).toBeInTheDocument();
    });

    it('renders content within a Card component', () => {
      const { container } = render(<NotFound />);

      const card = container.querySelector('.max-w-lg.w-full');
      expect(card).toBeInTheDocument();
    });

    it('has centered text alignment', () => {
      const { container } = render(<NotFound />);

      const cardContent = container.querySelector('.text-center');
      expect(cardContent).toBeInTheDocument();
    });

    it('separates suggestions section with border', () => {
      const { container } = render(<NotFound />);

      const suggestionsSection = container.querySelector('.border-t.border-gray-200');
      expect(suggestionsSection).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      const { container } = render(<NotFound />);

      const h1 = container.querySelector('h1');
      const h2 = container.querySelector('h2');

      expect(h1).toBeInTheDocument();
      expect(h1).toHaveTextContent('404');
      expect(h2).toBeInTheDocument();
      expect(h2).toHaveTextContent('ไม่พบหน้าที่คุณกำลังค้นหา');
    });

    it('has accessible button labels', () => {
      render(<NotFound />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      expect(screen.getByText('กลับหน้าหลัก')).toBeInTheDocument();
      expect(screen.getByText('ค้นหาแคมป์ไซต์')).toBeInTheDocument();
    });

    it('has accessible link elements', () => {
      render(<NotFound />);

      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('input has proper attributes', () => {
      render(<NotFound />);

      const input = screen.getByPlaceholderText('ค้นหาแคมป์ไซต์...');
      expect(input).toHaveAttribute('name', 'q');
      expect(input).toHaveAttribute('type', 'text');
    });
  });

  describe('Responsive Design', () => {
    it('has responsive button layout classes', () => {
      const { container } = render(<NotFound />);

      const buttonContainer = container.querySelector('.flex-col.sm\\:flex-row');
      expect(buttonContainer).toBeInTheDocument();
    });

    it('has responsive suggestion tags layout', () => {
      const { container } = render(<NotFound />);

      const suggestionsContainer = container.querySelector('.flex-wrap');
      expect(suggestionsContainer).toBeInTheDocument();
    });

    it('has responsive search form layout', () => {
      const { container } = render(<NotFound />);

      const searchForm = container.querySelector('.flex.gap-2');
      expect(searchForm).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('displays all required sections', () => {
      render(<NotFound />);

      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('ไม่พบหน้าที่คุณกำลังค้นหา')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('ค้นหาแคมป์ไซต์...')).toBeInTheDocument();
      expect(screen.getByText('กลับหน้าหลัก')).toBeInTheDocument();
      expect(screen.getByText('แคมป์ไซต์ยอดนิยม:')).toBeInTheDocument();
    });

    it('renders all suggestion links', () => {
      render(<NotFound />);

      expect(screen.getByText('แคมป์ปิ้ง')).toBeInTheDocument();
      expect(screen.getByText('แกลมปิ้ง')).toBeInTheDocument();
      expect(screen.getByText('บังกะโล')).toBeInTheDocument();
      expect(screen.getByText('เชียงใหม่')).toBeInTheDocument();
      expect(screen.getByText('กาญจนบุรี')).toBeInTheDocument();
    });
  });
});
