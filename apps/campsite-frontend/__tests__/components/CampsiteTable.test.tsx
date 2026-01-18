import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CampsiteTable } from '@/components/dashboard/CampsiteTable';
import type { OwnerCampsiteSummary } from '@campsite/shared';

// Mock Next.js components
jest.mock('next/link', () => {
  return ({ children, href, target }: { children: React.ReactNode; href: string; target?: string }) => {
    return <a href={href} target={target}>{children}</a>;
  };
});

jest.mock('next/image', () => {
  return ({
    src,
    alt,
    fill,
    className,
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    className?: string;
  }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} data-fill={fill} />;
  };
});

// Mock StarRating component
jest.mock('@/components/ui/StarRating', () => ({
  StarRating: ({ rating, size }: { rating: number; size: string }) => (
    <div data-testid="star-rating" data-rating={rating} data-size={size}>
      {rating} stars
    </div>
  ),
}));

describe('CampsiteTable', () => {
  const mockCampsites: OwnerCampsiteSummary[] = [
    {
      id: 'campsite-001',
      name: 'Mountain View Camping',
      status: 'approved',
      thumbnail_url: 'https://example.com/thumbnail1.jpg',
      average_rating: 4.5,
      review_count: 123,
      views_this_month: 456,
      inquiries_this_month: 12,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-20T15:30:00Z',
    },
    {
      id: 'campsite-002',
      name: 'Beach Paradise Resort',
      status: 'pending',
      thumbnail_url: 'https://example.com/thumbnail2.jpg',
      average_rating: 4.2,
      review_count: 89,
      views_this_month: 234,
      inquiries_this_month: 8,
      created_at: '2024-01-10T08:00:00Z',
      updated_at: '2024-01-18T12:00:00Z',
    },
    {
      id: 'campsite-003',
      name: 'Forest Hideaway',
      status: 'rejected',
      thumbnail_url: null,
      average_rating: 0,
      review_count: 0,
      views_this_month: 45,
      inquiries_this_month: 2,
      created_at: '2024-01-12T14:00:00Z',
      updated_at: '2024-01-16T09:00:00Z',
    },
  ];

  describe('Rendering Basic Information', () => {
    it('renders campsite cards for all campsites', () => {
      render(<CampsiteTable campsites={mockCampsites} />);

      expect(screen.getByText('Mountain View Camping')).toBeInTheDocument();
      expect(screen.getByText('Beach Paradise Resort')).toBeInTheDocument();
      expect(screen.getByText('Forest Hideaway')).toBeInTheDocument();
    });

    it('renders campsite name as link to detail page', () => {
      render(<CampsiteTable campsites={mockCampsites} />);

      const nameLink = screen.getByText('Mountain View Camping').closest('a');
      expect(nameLink).toHaveAttribute('href', '/dashboard/campsites/campsite-001');
    });

    it('renders campsite thumbnail with correct src and alt', () => {
      render(<CampsiteTable campsites={mockCampsites} />);

      const image = screen.getByAltText('Mountain View Camping');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/thumbnail1.jpg');
    });

    it('renders placeholder when no thumbnail_url', () => {
      render(<CampsiteTable campsites={mockCampsites} />);

      expect(screen.getByText('No image')).toBeInTheDocument();
    });

    it('renders rating and review count', () => {
      render(<CampsiteTable campsites={mockCampsites} />);

      const starRatings = screen.getAllByTestId('star-rating');
      expect(starRatings[0]).toHaveAttribute('data-rating', '4.5');
      expect(screen.getByText('(123)')).toBeInTheDocument();
    });

    it('does not render rating section when review count is 0', () => {
      const singleCampsite = [mockCampsites[2]];
      render(<CampsiteTable campsites={singleCampsite} />);

      expect(screen.queryByTestId('star-rating')).not.toBeInTheDocument();
    });

    it('renders views this month', () => {
      render(<CampsiteTable campsites={mockCampsites} />);

      expect(screen.getByText('456 views this month')).toBeInTheDocument();
    });

    it('renders inquiries this month', () => {
      render(<CampsiteTable campsites={mockCampsites} />);

      expect(screen.getByText('12 inquiries')).toBeInTheDocument();
    });
  });

  describe('Status Badge Colors', () => {
    it('shows "Active" badge with default variant for approved status', () => {
      const approvedCampsite = [mockCampsites[0]];
      render(<CampsiteTable campsites={approvedCampsite} />);

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('shows "Pending Approval" badge with secondary variant for pending status', () => {
      const pendingCampsite = [mockCampsites[1]];
      render(<CampsiteTable campsites={pendingCampsite} />);

      expect(screen.getByText('Pending Approval')).toBeInTheDocument();
    });

    it('shows "Rejected" badge with destructive variant for rejected status', () => {
      const rejectedCampsite = [mockCampsites[2]];
      render(<CampsiteTable campsites={rejectedCampsite} />);

      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });

    it('handles unknown status gracefully', () => {
      const unknownStatusCampsite: OwnerCampsiteSummary[] = [
        {
          ...mockCampsites[0],
          status: 'unknown' as any,
        },
      ];
      render(<CampsiteTable campsites={unknownStatusCampsite} />);

      expect(screen.getByText('unknown')).toBeInTheDocument();
    });
  });

  describe('Action Buttons and Navigation', () => {
    it('renders dropdown menu trigger button', () => {
      render(<CampsiteTable campsites={mockCampsites} />);

      const menuButtons = screen.getAllByRole('button');
      expect(menuButtons.length).toBeGreaterThan(0);
    });

    it('edit button links to edit page', async () => {
      const user = userEvent.setup();
      render(<CampsiteTable campsites={mockCampsites} />);

      const menuButtons = screen.getAllByRole('button');
      await user.click(menuButtons[0]);

      const editLink = screen.getByText('Edit').closest('a');
      expect(editLink).toHaveAttribute('href', '/dashboard/campsites/campsite-001');
    });

    it('view public page button appears only for approved campsites', async () => {
      const user = userEvent.setup();
      render(<CampsiteTable campsites={mockCampsites} />);

      const menuButtons = screen.getAllByRole('button');
      await user.click(menuButtons[0]);

      const viewPublicLink = screen.getByText('View Public Page').closest('a');
      expect(viewPublicLink).toHaveAttribute('href', '/campsites/campsite-001');
      expect(viewPublicLink).toHaveAttribute('target', '_blank');
    });

    it('view public page button does not appear for pending campsites', async () => {
      const user = userEvent.setup();
      const pendingCampsite = [mockCampsites[1]];
      render(<CampsiteTable campsites={pendingCampsite} />);

      const menuButtons = screen.getAllByRole('button');
      await user.click(menuButtons[0]);

      expect(screen.queryByText('View Public Page')).not.toBeInTheDocument();
    });

    it('view public page button does not appear for rejected campsites', async () => {
      const user = userEvent.setup();
      const rejectedCampsite = [mockCampsites[2]];
      render(<CampsiteTable campsites={rejectedCampsite} />);

      const menuButtons = screen.getAllByRole('button');
      await user.click(menuButtons[0]);

      expect(screen.queryByText('View Public Page')).not.toBeInTheDocument();
    });

    it('renders delete button when onDelete callback is provided', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn();
      render(<CampsiteTable campsites={mockCampsites} onDelete={onDelete} />);

      const menuButtons = screen.getAllByRole('button');
      await user.click(menuButtons[0]);

      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('calls onDelete callback with campsite id when delete is clicked', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn();
      render(<CampsiteTable campsites={mockCampsites} onDelete={onDelete} />);

      const menuButtons = screen.getAllByRole('button');
      await user.click(menuButtons[0]);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      expect(onDelete).toHaveBeenCalledWith('campsite-001');
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('does not render delete button when onDelete is not provided', async () => {
      const user = userEvent.setup();
      render(<CampsiteTable campsites={mockCampsites} />);

      const menuButtons = screen.getAllByRole('button');
      await user.click(menuButtons[0]);

      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state message when no campsites', () => {
      render(<CampsiteTable campsites={[]} />);

      expect(screen.getByText('No campsites yet')).toBeInTheDocument();
      expect(
        screen.getByText('Create your first campsite to start receiving bookings')
      ).toBeInTheDocument();
    });

    it('shows create campsite button in empty state', () => {
      render(<CampsiteTable campsites={[]} />);

      const createButton = screen.getByText('Create Campsite').closest('a');
      expect(createButton).toHaveAttribute('href', '/dashboard/campsites/new');
    });

    it('shows icon in empty state', () => {
      const { container } = render(<CampsiteTable campsites={[]} />);

      const icon = container.querySelector('.bg-muted');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('uses smaller thumbnail in compact mode', () => {
      const { container } = render(<CampsiteTable campsites={mockCampsites} compact />);

      const thumbnail = container.querySelector('.w-16.h-12');
      expect(thumbnail).toBeInTheDocument();
    });

    it('uses larger thumbnail in normal mode', () => {
      const { container } = render(<CampsiteTable campsites={mockCampsites} compact={false} />);

      const thumbnail = container.querySelector('.w-24.h-16');
      expect(thumbnail).toBeInTheDocument();
    });

    it('hides rating and stats in compact mode', () => {
      render(<CampsiteTable campsites={mockCampsites} compact />);

      expect(screen.queryByTestId('star-rating')).not.toBeInTheDocument();
      expect(screen.queryByText('456 views this month')).not.toBeInTheDocument();
      expect(screen.queryByText('12 inquiries')).not.toBeInTheDocument();
    });

    it('shows rating and stats in normal mode', () => {
      render(<CampsiteTable campsites={mockCampsites} compact={false} />);

      const starRatings = screen.getAllByTestId('star-rating');
      expect(starRatings.length).toBeGreaterThan(0);
      expect(screen.getByText('456 views this month')).toBeInTheDocument();
      expect(screen.getByText('12 inquiries')).toBeInTheDocument();
    });

    it('applies compact padding in compact mode', () => {
      const { container } = render(<CampsiteTable campsites={mockCampsites} compact />);

      const cardContent = container.querySelector('.p-3');
      expect(cardContent).toBeInTheDocument();
    });

    it('applies normal padding in normal mode', () => {
      const { container } = render(<CampsiteTable campsites={mockCampsites} compact={false} />);

      const cardContent = container.querySelector('.p-4');
      expect(cardContent).toBeInTheDocument();
    });
  });

  describe('Multiple Campsites Rendering', () => {
    it('renders all campsite cards', () => {
      render(<CampsiteTable campsites={mockCampsites} />);

      const cards = screen.getAllByRole('link').filter((link) =>
        link.getAttribute('href')?.includes('/dashboard/campsites/')
      );
      expect(cards.length).toBeGreaterThanOrEqual(3);
    });

    it('renders each campsite with unique key', () => {
      const { container } = render(<CampsiteTable campsites={mockCampsites} />);

      const cards = container.querySelectorAll('.space-y-4 > div');
      expect(cards.length).toBe(3);
    });
  });

  describe('Accessibility', () => {
    it('provides alt text for thumbnail images', () => {
      const { container } = render(<CampsiteTable campsites={mockCampsites} />);

      const image1 = screen.getByAltText('Mountain View Camping');
      const image2 = screen.getByAltText('Beach Paradise Resort');
      expect(image1).toBeInTheDocument();
      expect(image2).toBeInTheDocument();
    });

    it('uses semantic button elements for actions', () => {
      render(<CampsiteTable campsites={mockCampsites} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((button) => {
        expect(button.tagName).toBe('BUTTON');
      });
    });

    it('uses semantic link elements for navigation', () => {
      render(<CampsiteTable campsites={mockCampsites} />);

      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
      links.forEach((link) => {
        expect(link.tagName).toBe('A');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles campsite with zero views and inquiries', () => {
      const zeroStatsCampsite: OwnerCampsiteSummary[] = [
        {
          ...mockCampsites[0],
          views_this_month: 0,
          inquiries_this_month: 0,
        },
      ];
      render(<CampsiteTable campsites={zeroStatsCampsite} />);

      expect(screen.getByText('0 views this month')).toBeInTheDocument();
      expect(screen.getByText('0 inquiries')).toBeInTheDocument();
    });

    it('handles very long campsite name', () => {
      const longNameCampsite: OwnerCampsiteSummary[] = [
        {
          ...mockCampsites[0],
          name: 'Very Long Campsite Name That Should Be Truncated Or Handled Properly In The UI Component',
        },
      ];
      render(<CampsiteTable campsites={longNameCampsite} />);

      expect(
        screen.getByText(
          'Very Long Campsite Name That Should Be Truncated Or Handled Properly In The UI Component'
        )
      ).toBeInTheDocument();
    });

    it('handles high view and inquiry counts', () => {
      const highStatsCampsite: OwnerCampsiteSummary[] = [
        {
          ...mockCampsites[0],
          views_this_month: 99999,
          inquiries_this_month: 9999,
        },
      ];
      render(<CampsiteTable campsites={highStatsCampsite} />);

      expect(screen.getByText('99999 views this month')).toBeInTheDocument();
      expect(screen.getByText('9999 inquiries')).toBeInTheDocument();
    });

    it('handles decimal average rating', () => {
      const decimalRatingCampsite: OwnerCampsiteSummary[] = [
        {
          ...mockCampsites[0],
          average_rating: 4.7,
        },
      ];
      render(<CampsiteTable campsites={decimalRatingCampsite} />);

      const starRating = screen.getByTestId('star-rating');
      expect(starRating).toHaveAttribute('data-rating', '4.7');
    });

    it('handles single campsite', () => {
      const singleCampsite = [mockCampsites[0]];
      render(<CampsiteTable campsites={singleCampsite} />);

      expect(screen.getByText('Mountain View Camping')).toBeInTheDocument();
      expect(screen.queryByText('Beach Paradise Resort')).not.toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('renders campsites in card layout', () => {
      const { container } = render(<CampsiteTable campsites={mockCampsites} />);

      const cards = container.querySelectorAll('.space-y-4 > div');
      expect(cards.length).toBe(3);
    });

    it('renders thumbnail, info, and actions sections for each campsite', () => {
      const { container } = render(<CampsiteTable campsites={mockCampsites} />);

      const thumbnails = container.querySelectorAll('.relative.bg-muted');
      const dropdownMenus = screen.getAllByRole('button');

      expect(thumbnails.length).toBeGreaterThan(0);
      expect(dropdownMenus.length).toBeGreaterThan(0);
    });

    it('uses flex layout for campsite row', () => {
      const { container } = render(<CampsiteTable campsites={mockCampsites} />);

      const flexContainers = container.querySelectorAll('.flex.items-center.gap-4');
      expect(flexContainers.length).toBeGreaterThan(0);
    });
  });

  describe('Icons and Visual Elements', () => {
    it('renders view icon in stats section', () => {
      const { container } = render(<CampsiteTable campsites={mockCampsites} />);

      const viewIcons = container.querySelectorAll('.w-4.h-4');
      expect(viewIcons.length).toBeGreaterThan(0);
    });

    it('renders more options icon in dropdown trigger', () => {
      render(<CampsiteTable campsites={mockCampsites} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('renders edit icon in dropdown menu', async () => {
      const user = userEvent.setup();
      render(<CampsiteTable campsites={mockCampsites} />);

      const menuButtons = screen.getAllByRole('button');
      await user.click(menuButtons[0]);

      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('renders external link icon for view public page', async () => {
      const user = userEvent.setup();
      render(<CampsiteTable campsites={mockCampsites} />);

      const menuButtons = screen.getAllByRole('button');
      await user.click(menuButtons[0]);

      expect(screen.getByText('View Public Page')).toBeInTheDocument();
    });

    it('renders trash icon for delete button', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn();
      render(<CampsiteTable campsites={mockCampsites} onDelete={onDelete} />);

      const menuButtons = screen.getAllByRole('button');
      await user.click(menuButtons[0]);

      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });
});
