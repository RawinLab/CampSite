import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '@/components/search/Pagination';

describe('Pagination Component', () => {
  const mockOnPageChange = jest.fn();

  beforeEach(() => {
    mockOnPageChange.mockClear();
  });

  describe('Basic rendering', () => {
    it('renders page numbers correctly', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('current page is highlighted', () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const currentPageButton = screen.getByLabelText('หน้า 3');
      expect(currentPageButton).toHaveClass('bg-green-600');
      expect(currentPageButton).toHaveAttribute('aria-current', 'page');
    });

    it('applies custom className', () => {
      const { container } = render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
          className="custom-pagination"
        />
      );

      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('custom-pagination');
    });
  });

  describe('Navigation buttons', () => {
    it('previous button disabled on first page', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const prevButton = screen.getByLabelText('หน้าก่อนหน้า');
      expect(prevButton).toBeDisabled();
    });

    it('next button disabled on last page', () => {
      render(
        <Pagination
          currentPage={5}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const nextButton = screen.getByLabelText('หน้าถัดไป');
      expect(nextButton).toBeDisabled();
    });

    it('previous button enabled when not on first page', () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const prevButton = screen.getByLabelText('หน้าก่อนหน้า');
      expect(prevButton).not.toBeDisabled();
    });

    it('next button enabled when not on last page', () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const nextButton = screen.getByLabelText('หน้าถัดไป');
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe('User interactions', () => {
    it('clicking page number calls onChange', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const page3Button = screen.getByLabelText('หน้า 3');
      fireEvent.click(page3Button);

      expect(mockOnPageChange).toHaveBeenCalledWith(3);
      expect(mockOnPageChange).toHaveBeenCalledTimes(1);
    });

    it('clicking next button calls onChange with next page', () => {
      render(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const nextButton = screen.getByLabelText('หน้าถัดไป');
      fireEvent.click(nextButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });

    it('clicking previous button calls onChange with previous page', () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const prevButton = screen.getByLabelText('หน้าก่อนหน้า');
      fireEvent.click(prevButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });
  });

  describe('Ellipsis handling for large page counts', () => {
    it('shows ellipsis for large page counts', () => {
      render(
        <Pagination
          currentPage={5}
          totalPages={20}
          onPageChange={mockOnPageChange}
        />
      );

      const ellipsis = screen.getAllByText('...');
      expect(ellipsis.length).toBeGreaterThan(0);
    });

    it('first and last page always shown for large page counts', () => {
      render(
        <Pagination
          currentPage={10}
          totalPages={20}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByLabelText('หน้า 1')).toBeInTheDocument();
      expect(screen.getByLabelText('หน้า 20')).toBeInTheDocument();
    });

    it('shows correct pages near start (page 1)', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={20}
          onPageChange={mockOnPageChange}
        />
      );

      // Should show: 1 2 3 4 5 ... 20
      expect(screen.getByLabelText('หน้า 1')).toBeInTheDocument();
      expect(screen.getByLabelText('หน้า 2')).toBeInTheDocument();
      expect(screen.getByLabelText('หน้า 3')).toBeInTheDocument();
      expect(screen.getByLabelText('หน้า 4')).toBeInTheDocument();
      expect(screen.getByLabelText('หน้า 5')).toBeInTheDocument();
      expect(screen.getByLabelText('หน้า 20')).toBeInTheDocument();

      const ellipsis = screen.getAllByText('...');
      expect(ellipsis).toHaveLength(1);
    });

    it('shows correct pages near end (page 20 of 20)', () => {
      render(
        <Pagination
          currentPage={20}
          totalPages={20}
          onPageChange={mockOnPageChange}
        />
      );

      // Should show: 1 ... 16 17 18 19 20
      expect(screen.getByLabelText('หน้า 1')).toBeInTheDocument();
      expect(screen.getByLabelText('หน้า 16')).toBeInTheDocument();
      expect(screen.getByLabelText('หน้า 17')).toBeInTheDocument();
      expect(screen.getByLabelText('หน้า 18')).toBeInTheDocument();
      expect(screen.getByLabelText('หน้า 19')).toBeInTheDocument();
      expect(screen.getByLabelText('หน้า 20')).toBeInTheDocument();

      const ellipsis = screen.getAllByText('...');
      expect(ellipsis).toHaveLength(1);
    });

    it('shows correct pages in middle (page 10 of 20)', () => {
      render(
        <Pagination
          currentPage={10}
          totalPages={20}
          onPageChange={mockOnPageChange}
        />
      );

      // Should show: 1 ... 9 10 11 ... 20
      expect(screen.getByLabelText('หน้า 1')).toBeInTheDocument();
      expect(screen.getByLabelText('หน้า 9')).toBeInTheDocument();
      expect(screen.getByLabelText('หน้า 10')).toBeInTheDocument();
      expect(screen.getByLabelText('หน้า 11')).toBeInTheDocument();
      expect(screen.getByLabelText('หน้า 20')).toBeInTheDocument();

      const ellipsis = screen.getAllByText('...');
      expect(ellipsis).toHaveLength(2);
    });

    it('no ellipsis when pages <= 7', () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={7}
          onPageChange={mockOnPageChange}
        />
      );

      const ellipsis = screen.queryAllByText('...');
      expect(ellipsis).toHaveLength(0);

      // All pages should be visible
      for (let i = 1; i <= 7; i++) {
        expect(screen.getByLabelText(`หน้า ${i}`)).toBeInTheDocument();
      }
    });
  });

  describe('Edge cases', () => {
    it('handles single page gracefully', () => {
      const { container } = render(
        <Pagination
          currentPage={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      // Should not render anything
      expect(container.querySelector('nav')).not.toBeInTheDocument();
    });

    it('handles zero total pages', () => {
      const { container } = render(
        <Pagination
          currentPage={1}
          totalPages={0}
          onPageChange={mockOnPageChange}
        />
      );

      // Should not render anything
      expect(container.querySelector('nav')).not.toBeInTheDocument();
    });

    it('handles two pages', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={2}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByLabelText('หน้า 1')).toBeInTheDocument();
      expect(screen.getByLabelText('หน้า 2')).toBeInTheDocument();
      expect(screen.getByLabelText('หน้าก่อนหน้า')).toBeInTheDocument();
      expect(screen.getByLabelText('หน้าถัดไป')).toBeInTheDocument();
    });
  });

  describe('Page calculation with different limits', () => {
    it('handles 12 items per page (100 total items)', () => {
      // 100 items / 12 per page = 9 pages (rounded up)
      const totalItems = 100;
      const itemsPerPage = 12;
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      render(
        <Pagination
          currentPage={1}
          totalPages={totalPages}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByLabelText('หน้า 1')).toBeInTheDocument();
      expect(screen.getByLabelText(`หน้า ${totalPages}`)).toBeInTheDocument();
    });

    it('handles 24 items per page (100 total items)', () => {
      // 100 items / 24 per page = 5 pages (rounded up)
      const totalItems = 100;
      const itemsPerPage = 24;
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      render(
        <Pagination
          currentPage={1}
          totalPages={totalPages}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByLabelText('หน้า 1')).toBeInTheDocument();
      expect(screen.getByLabelText(`หน้า ${totalPages}`)).toBeInTheDocument();

      // Should show all pages (5 <= 7)
      for (let i = 1; i <= totalPages; i++) {
        expect(screen.getByLabelText(`หน้า ${i}`)).toBeInTheDocument();
      }
    });

    it('handles 36 items per page (100 total items)', () => {
      // 100 items / 36 per page = 3 pages (rounded up)
      const totalItems = 100;
      const itemsPerPage = 36;
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      render(
        <Pagination
          currentPage={1}
          totalPages={totalPages}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByLabelText('หน้า 1')).toBeInTheDocument();
      expect(screen.getByLabelText(`หน้า ${totalPages}`)).toBeInTheDocument();

      // Should show all pages (3 <= 7)
      for (let i = 1; i <= totalPages; i++) {
        expect(screen.getByLabelText(`หน้า ${i}`)).toBeInTheDocument();
      }
    });

    it('handles exact division (120 items / 12 per page = 10 pages)', () => {
      const totalItems = 120;
      const itemsPerPage = 12;
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      render(
        <Pagination
          currentPage={5}
          totalPages={totalPages}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByLabelText('หน้า 1')).toBeInTheDocument();
      expect(screen.getByLabelText('หน้า 10')).toBeInTheDocument();
    });

    it('handles large dataset (1000 items / 12 per page)', () => {
      const totalItems = 1000;
      const itemsPerPage = 12;
      const totalPages = Math.ceil(totalItems / itemsPerPage); // 84 pages

      render(
        <Pagination
          currentPage={42}
          totalPages={totalPages}
          onPageChange={mockOnPageChange}
        />
      );

      // Should show ellipsis
      const ellipsis = screen.getAllByText('...');
      expect(ellipsis).toHaveLength(2);

      // First and last should always be visible
      expect(screen.getByLabelText('หน้า 1')).toBeInTheDocument();
      expect(screen.getByLabelText(`หน้า ${totalPages}`)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper aria-label for navigation', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const nav = screen.getByRole('navigation', { name: 'Pagination' });
      expect(nav).toBeInTheDocument();
    });

    it('page buttons have proper aria-labels', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByLabelText('หน้า 1')).toBeInTheDocument();
      expect(screen.getByLabelText('หน้า 2')).toBeInTheDocument();
      expect(screen.getByLabelText('หน้า 3')).toBeInTheDocument();
    });

    it('ellipsis has aria-hidden attribute', () => {
      render(
        <Pagination
          currentPage={10}
          totalPages={20}
          onPageChange={mockOnPageChange}
        />
      );

      const ellipsis = screen.getAllByText('...');
      ellipsis.forEach((el) => {
        expect(el).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('navigation buttons have Thai language labels', () => {
      render(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByLabelText('หน้าก่อนหน้า')).toBeInTheDocument();
      expect(screen.getByLabelText('หน้าถัดไป')).toBeInTheDocument();
    });
  });
});
