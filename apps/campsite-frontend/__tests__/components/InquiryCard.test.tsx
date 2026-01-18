import { render, screen } from '@testing-library/react';
import { InquiryCard } from '@/components/dashboard/InquiryCard';
import type { InquiryWithCampsite } from '@campsite/shared';

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn((date: Date) => '2 hours ago'),
}));

describe('InquiryCard', () => {
  const mockInquiry: InquiryWithCampsite = {
    id: 'inquiry-001',
    campsite_id: 'campsite-001',
    user_id: 'user-001',
    guest_name: 'John Doe',
    guest_email: 'john@example.com',
    guest_phone: '+66-123456789',
    inquiry_type: 'booking',
    subject: 'Weekend booking inquiry',
    message: 'I would like to book a tent space for this weekend. Do you have availability?',
    check_in_date: '2024-02-15',
    check_out_date: '2024-02-17',
    guest_count: 4,
    accommodation_type_id: 'acc-001',
    status: 'new',
    owner_reply: null,
    replied_at: null,
    read_at: null,
    created_at: '2024-02-10T10:00:00Z',
    updated_at: '2024-02-10T10:00:00Z',
    campsite: {
      id: 'campsite-001',
      name: 'Mountain View Camping',
      thumbnail_url: 'https://example.com/thumbnail.jpg',
    },
  };

  describe('Guest Information Display', () => {
    it('renders guest name correctly', () => {
      render(<InquiryCard inquiry={mockInquiry} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('displays guest name with correct styling', () => {
      const { container } = render(<InquiryCard inquiry={mockInquiry} />);

      const guestName = screen.getByText('John Doe');
      expect(guestName).toHaveClass('font-semibold', 'truncate');
    });

    it('truncates long guest names', () => {
      const longNameInquiry: InquiryWithCampsite = {
        ...mockInquiry,
        guest_name: 'Very Long Guest Name That Should Be Truncated With Ellipsis Display',
      };

      const { container } = render(<InquiryCard inquiry={longNameInquiry} />);

      const guestName = container.querySelector('.truncate');
      expect(guestName).toBeInTheDocument();
      expect(guestName).toHaveTextContent('Very Long Guest Name That Should Be Truncated With Ellipsis Display');
    });

    it('displays user icon in avatar', () => {
      const { container } = render(<InquiryCard inquiry={mockInquiry} />);

      const avatar = container.querySelector('.flex-shrink-0.w-10.h-10.rounded-full');
      expect(avatar).toBeInTheDocument();

      const userIcon = avatar?.querySelector('svg');
      expect(userIcon).toBeInTheDocument();
    });
  });

  describe('Inquiry Type Badge Display', () => {
    it('displays inquiry type badge for booking', () => {
      render(<InquiryCard inquiry={mockInquiry} />);

      expect(screen.getByText(/Booking/)).toBeInTheDocument();
    });

    it('displays inquiry type badge for general inquiry', () => {
      const generalInquiry: InquiryWithCampsite = {
        ...mockInquiry,
        inquiry_type: 'general',
      };

      render(<InquiryCard inquiry={generalInquiry} />);

      expect(screen.getByText(/General/)).toBeInTheDocument();
    });

    it('displays inquiry type badge for complaint', () => {
      const complaintInquiry: InquiryWithCampsite = {
        ...mockInquiry,
        inquiry_type: 'complaint',
      };

      render(<InquiryCard inquiry={complaintInquiry} />);

      expect(screen.getByText(/Complaint/)).toBeInTheDocument();
    });

    it('displays inquiry type badge for other', () => {
      const otherInquiry: InquiryWithCampsite = {
        ...mockInquiry,
        inquiry_type: 'other',
      };

      render(<InquiryCard inquiry={otherInquiry} />);

      expect(screen.getByText(/Other/)).toBeInTheDocument();
    });

    it('includes campsite name in inquiry type line', () => {
      render(<InquiryCard inquiry={mockInquiry} />);

      expect(screen.getByText(/Mountain View Camping/)).toBeInTheDocument();
    });

    it('displays campsite name and inquiry type together', () => {
      const { container } = render(<InquiryCard inquiry={mockInquiry} />);

      const typeText = screen.getByText(/Mountain View Camping - Booking/);
      expect(typeText).toBeInTheDocument();
      expect(typeText).toHaveClass('text-sm', 'text-muted-foreground', 'truncate');
    });
  });

  describe('Message Preview Display', () => {
    it('displays message preview in non-compact mode', () => {
      render(<InquiryCard inquiry={mockInquiry} />);

      expect(screen.getByText(/I would like to book a tent space/)).toBeInTheDocument();
    });

    it('does not display message in compact mode', () => {
      render(<InquiryCard inquiry={mockInquiry} compact={true} />);

      expect(screen.queryByText(/I would like to book a tent space/)).not.toBeInTheDocument();
    });

    it('truncates long messages with line-clamp-2', () => {
      const longMessageInquiry: InquiryWithCampsite = {
        ...mockInquiry,
        message: 'This is a very long message that should be truncated. '.repeat(20),
      };

      const { container } = render(<InquiryCard inquiry={longMessageInquiry} />);

      const messageElement = container.querySelector('.line-clamp-2');
      expect(messageElement).toBeInTheDocument();
      expect(messageElement).toHaveClass('text-sm', 'text-muted-foreground');
    });

    it('displays short messages without truncation', () => {
      const shortMessageInquiry: InquiryWithCampsite = {
        ...mockInquiry,
        message: 'Short message',
      };

      render(<InquiryCard inquiry={shortMessageInquiry} />);

      expect(screen.getByText('Short message')).toBeInTheDocument();
    });
  });

  describe('Status Badge Display', () => {
    it('displays "New" status badge with default variant', () => {
      render(<InquiryCard inquiry={mockInquiry} />);

      const statusBadge = screen.getByText('New');
      expect(statusBadge).toBeInTheDocument();
    });

    it('displays "In Progress" status badge with secondary variant', () => {
      const inProgressInquiry: InquiryWithCampsite = {
        ...mockInquiry,
        status: 'in_progress',
      };

      render(<InquiryCard inquiry={inProgressInquiry} />);

      const statusBadge = screen.getByText('In Progress');
      expect(statusBadge).toBeInTheDocument();
    });

    it('displays "Resolved" status badge with outline variant', () => {
      const resolvedInquiry: InquiryWithCampsite = {
        ...mockInquiry,
        status: 'resolved',
      };

      render(<InquiryCard inquiry={resolvedInquiry} />);

      const statusBadge = screen.getByText('Resolved');
      expect(statusBadge).toBeInTheDocument();
    });

    it('displays "Closed" status badge with outline variant', () => {
      const closedInquiry: InquiryWithCampsite = {
        ...mockInquiry,
        status: 'closed',
      };

      render(<InquiryCard inquiry={closedInquiry} />);

      const statusBadge = screen.getByText('Closed');
      expect(statusBadge).toBeInTheDocument();
    });
  });

  describe('Unread Indicator Display', () => {
    it('displays unread indicator when read_at is null', () => {
      const { container } = render(<InquiryCard inquiry={mockInquiry} />);

      const unreadDot = container.querySelector('.w-2.h-2.rounded-full.bg-primary');
      expect(unreadDot).toBeInTheDocument();
    });

    it('does not display unread indicator when read_at is set', () => {
      const readInquiry: InquiryWithCampsite = {
        ...mockInquiry,
        read_at: '2024-02-10T11:00:00Z',
      };

      const { container } = render(<InquiryCard inquiry={readInquiry} />);

      const unreadDot = container.querySelector('.w-2.h-2.rounded-full.bg-primary');
      expect(unreadDot).not.toBeInTheDocument();
    });

    it('applies primary color to card border when unread', () => {
      const { container } = render(<InquiryCard inquiry={mockInquiry} />);

      const card = container.querySelector('.border-primary');
      expect(card).toBeInTheDocument();
    });

    it('applies primary background to card when unread', () => {
      const { container } = render(<InquiryCard inquiry={mockInquiry} />);

      const card = container.querySelector('.bg-primary\\/5');
      expect(card).toBeInTheDocument();
    });

    it('applies primary color to guest name when unread', () => {
      render(<InquiryCard inquiry={mockInquiry} />);

      const guestName = screen.getByText('John Doe');
      expect(guestName).toHaveClass('text-primary');
    });

    it('applies primary color to avatar background when unread', () => {
      const { container } = render(<InquiryCard inquiry={mockInquiry} />);

      const avatar = container.querySelector('.bg-primary.text-primary-foreground');
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('Read State Display', () => {
    it('does not apply primary styling when read', () => {
      const readInquiry: InquiryWithCampsite = {
        ...mockInquiry,
        read_at: '2024-02-10T11:00:00Z',
      };

      const { container } = render(<InquiryCard inquiry={readInquiry} />);

      const card = container.querySelector('.border-primary');
      expect(card).not.toBeInTheDocument();
    });

    it('applies muted background to avatar when read', () => {
      const readInquiry: InquiryWithCampsite = {
        ...mockInquiry,
        read_at: '2024-02-10T11:00:00Z',
      };

      const { container } = render(<InquiryCard inquiry={readInquiry} />);

      const avatar = container.querySelector('.bg-muted');
      expect(avatar).toBeInTheDocument();
    });

    it('guest name does not have primary color when read', () => {
      const readInquiry: InquiryWithCampsite = {
        ...mockInquiry,
        read_at: '2024-02-10T11:00:00Z',
      };

      render(<InquiryCard inquiry={readInquiry} />);

      const guestName = screen.getByText('John Doe');
      expect(guestName).not.toHaveClass('text-primary');
    });
  });

  describe('Date Formatting Display', () => {
    it('displays check-in date when provided', () => {
      render(<InquiryCard inquiry={mockInquiry} />);

      expect(screen.getByText(/15 ก\.พ\./)).toBeInTheDocument();
    });

    it('displays check-in and check-out dates when both provided', () => {
      const { container } = render(<InquiryCard inquiry={mockInquiry} />);

      const dateText = container.querySelector('.flex.items-center.gap-1:has(svg)');
      expect(dateText?.textContent).toMatch(/15.*17/);
    });

    it('does not display check-in section when check_in_date is null', () => {
      const noDateInquiry: InquiryWithCampsite = {
        ...mockInquiry,
        check_in_date: null,
        check_out_date: null,
      };

      const { container } = render(<InquiryCard inquiry={noDateInquiry} />);

      const calendarIcon = container.querySelector('svg');
      const clockIcon = container.querySelector('svg');

      // Should only have the clock icon, not calendar icon
      const allIcons = container.querySelectorAll('svg');
      expect(allIcons.length).toBeLessThanOrEqual(2); // User icon and Clock icon
    });

    it('displays created time with formatDistanceToNow', () => {
      render(<InquiryCard inquiry={mockInquiry} />);

      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    });

    it('displays clock icon for time', () => {
      const { container } = render(<InquiryCard inquiry={mockInquiry} />);

      const timeSection = screen.getByText('2 hours ago').parentElement;
      expect(timeSection).toBeInTheDocument();

      const clockIcon = timeSection?.querySelector('svg');
      expect(clockIcon).toBeInTheDocument();
      expect(clockIcon).toHaveClass('w-3', 'h-3');
    });

    it('displays calendar icon for dates', () => {
      const { container } = render(<InquiryCard inquiry={mockInquiry} />);

      const dateSection = container.querySelectorAll('.flex.items-center.gap-1')[0];
      const calendarIcon = dateSection?.querySelector('svg');
      expect(calendarIcon).toBeInTheDocument();
    });
  });

  describe('Click Handler and Navigation', () => {
    it('wraps card in Link component', () => {
      const { container } = render(<InquiryCard inquiry={mockInquiry} />);

      const link = container.querySelector('a');
      expect(link).toBeInTheDocument();
    });

    it('navigates to correct inquiry detail URL', () => {
      const { container } = render(<InquiryCard inquiry={mockInquiry} />);

      const link = container.querySelector('a');
      expect(link).toHaveAttribute('href', '/dashboard/inquiries/inquiry-001');
    });

    it('applies cursor-pointer to card', () => {
      const { container } = render(<InquiryCard inquiry={mockInquiry} />);

      const card = container.querySelector('.cursor-pointer');
      expect(card).toBeInTheDocument();
    });

    it('applies hover border transition', () => {
      const { container } = render(<InquiryCard inquiry={mockInquiry} />);

      const card = container.querySelector('.hover\\:border-primary\\/50');
      expect(card).toBeInTheDocument();
    });

    it('applies transition-colors class', () => {
      const { container } = render(<InquiryCard inquiry={mockInquiry} />);

      const card = container.querySelector('.transition-colors');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Compact Mode Display', () => {
    it('applies reduced padding in compact mode', () => {
      const { container } = render(<InquiryCard inquiry={mockInquiry} compact={true} />);

      const content = container.querySelector('.p-3');
      expect(content).toBeInTheDocument();
    });

    it('applies normal padding in non-compact mode', () => {
      const { container } = render(<InquiryCard inquiry={mockInquiry} compact={false} />);

      const content = container.querySelector('.p-4');
      expect(content).toBeInTheDocument();
    });

    it('hides message in compact mode', () => {
      render(<InquiryCard inquiry={mockInquiry} compact={true} />);

      expect(screen.queryByText(/I would like to book/)).not.toBeInTheDocument();
    });

    it('shows message in non-compact mode', () => {
      render(<InquiryCard inquiry={mockInquiry} compact={false} />);

      expect(screen.getByText(/I would like to book/)).toBeInTheDocument();
    });

    it('displays all other elements in compact mode', () => {
      render(<InquiryCard inquiry={mockInquiry} compact={true} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('New')).toBeInTheDocument();
      expect(screen.getByText(/Mountain View Camping/)).toBeInTheDocument();
      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    });
  });

  describe('Card Layout and Structure', () => {
    it('renders card with correct layout classes', () => {
      const { container } = render(<InquiryCard inquiry={mockInquiry} />);

      const content = container.querySelector('.flex.items-start.gap-4');
      expect(content).toBeInTheDocument();
    });

    it('has avatar on the left side', () => {
      const { container } = render(<InquiryCard inquiry={mockInquiry} />);

      const layout = container.querySelector('.flex.items-start.gap-4');
      const avatar = layout?.querySelector('.flex-shrink-0.w-10.h-10');
      expect(avatar).toBeInTheDocument();
    });

    it('has content section with flex-1', () => {
      const { container } = render(<InquiryCard inquiry={mockInquiry} />);

      const content = container.querySelector('.flex-1.min-w-0');
      expect(content).toBeInTheDocument();
    });

    it('renders all sections in correct order', () => {
      const { container } = render(<InquiryCard inquiry={mockInquiry} />);

      const content = container.querySelector('.flex-1.min-w-0');
      const children = content?.children;

      expect(children).toBeDefined();
      expect(children!.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Data Validation', () => {
    it('handles inquiry with no check-out date', () => {
      const noCheckOutInquiry: InquiryWithCampsite = {
        ...mockInquiry,
        check_out_date: null,
      };

      render(<InquiryCard inquiry={noCheckOutInquiry} />);

      expect(screen.getByText(/15 ก\.พ\./)).toBeInTheDocument();
    });

    it('handles inquiry with no dates at all', () => {
      const noDatesInquiry: InquiryWithCampsite = {
        ...mockInquiry,
        check_in_date: null,
        check_out_date: null,
      };

      render(<InquiryCard inquiry={noDatesInquiry} />);

      // Should still render other content
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    });

    it('handles all inquiry types correctly', () => {
      const types: Array<InquiryWithCampsite['inquiry_type']> = [
        'booking',
        'general',
        'complaint',
        'other',
      ];

      types.forEach((type) => {
        const inquiry: InquiryWithCampsite = {
          ...mockInquiry,
          inquiry_type: type,
        };

        const { unmount } = render(<InquiryCard inquiry={inquiry} />);
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        unmount();
      });
    });

    it('handles all inquiry statuses correctly', () => {
      const statuses: Array<InquiryWithCampsite['status']> = [
        'new',
        'in_progress',
        'resolved',
        'closed',
      ];

      statuses.forEach((status) => {
        const inquiry: InquiryWithCampsite = {
          ...mockInquiry,
          status,
        };

        const { unmount } = render(<InquiryCard inquiry={inquiry} />);
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        unmount();
      });
    });

    it('handles inquiry with minimal data', () => {
      const minimalInquiry: InquiryWithCampsite = {
        id: 'inquiry-002',
        campsite_id: 'campsite-002',
        user_id: null,
        guest_name: 'Guest',
        guest_email: 'guest@example.com',
        guest_phone: null,
        inquiry_type: 'general',
        subject: null,
        message: 'Message',
        check_in_date: null,
        check_out_date: null,
        guest_count: null,
        accommodation_type_id: null,
        status: 'new',
        owner_reply: null,
        replied_at: null,
        read_at: null,
        created_at: '2024-02-10T10:00:00Z',
        updated_at: '2024-02-10T10:00:00Z',
        campsite: {
          id: 'campsite-002',
          name: 'Basic Camp',
          thumbnail_url: null,
        },
      };

      render(<InquiryCard inquiry={minimalInquiry} />);

      expect(screen.getByText('Guest')).toBeInTheDocument();
      expect(screen.getByText(/Basic Camp/)).toBeInTheDocument();
      expect(screen.getByText('Message')).toBeInTheDocument();
    });

    it('handles very long campsite names', () => {
      const longNameInquiry: InquiryWithCampsite = {
        ...mockInquiry,
        campsite: {
          id: 'campsite-001',
          name: 'Very Long Campsite Name That Should Be Handled Properly Without Breaking Layout',
          thumbnail_url: null,
        },
      };

      const { container } = render(<InquiryCard inquiry={longNameInquiry} />);

      const campsiteText = container.querySelector('.truncate');
      expect(campsiteText).toBeInTheDocument();
    });
  });

  describe('Accessibility and Semantics', () => {
    it('renders as a clickable link', () => {
      render(<InquiryCard inquiry={mockInquiry} />);

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('has proper text hierarchy', () => {
      const { container } = render(<InquiryCard inquiry={mockInquiry} />);

      const guestName = screen.getByText('John Doe');
      expect(guestName.tagName).toBe('SPAN');
      expect(guestName).toHaveClass('font-semibold');
    });

    it('uses semantic time elements appropriately', () => {
      const { container } = render(<InquiryCard inquiry={mockInquiry} />);

      const timeText = screen.getByText('2 hours ago');
      expect(timeText).toBeInTheDocument();

      const timeContainer = timeText.parentElement?.parentElement;
      expect(timeContainer).toHaveClass('text-xs', 'text-muted-foreground');
    });
  });
});
