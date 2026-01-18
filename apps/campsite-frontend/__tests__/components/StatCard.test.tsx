import { render, screen } from '@testing-library/react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Users, TrendingUp, TrendingDown } from 'lucide-react';

describe('StatCard', () => {
  describe('Title Display', () => {
    it('renders title correctly', () => {
      render(<StatCard title="Total Users" value={150} icon={Users} />);

      expect(screen.getByText('Total Users')).toBeInTheDocument();
    });

    it('displays title with correct styling', () => {
      render(<StatCard title="Active Sessions" value={42} icon={Users} />);

      const title = screen.getByText('Active Sessions');
      expect(title).toHaveClass('text-sm', 'text-muted-foreground');
    });

    it('renders different title texts', () => {
      const { rerender } = render(<StatCard title="Revenue" value={5000} icon={Users} />);
      expect(screen.getByText('Revenue')).toBeInTheDocument();

      rerender(<StatCard title="Conversions" value={89} icon={Users} />);
      expect(screen.getByText('Conversions')).toBeInTheDocument();
    });
  });

  describe('Value Display', () => {
    it('renders numeric value correctly', () => {
      render(<StatCard title="Total Users" value={150} icon={Users} />);

      expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('renders string value correctly', () => {
      render(<StatCard title="Status" value="Active" icon={Users} />);

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('displays value with correct styling', () => {
      render(<StatCard title="Total Users" value={150} icon={Users} />);

      const value = screen.getByText('150');
      expect(value).toHaveClass('text-2xl', 'font-bold');
    });

    it('formats large numbers with locale string', () => {
      render(<StatCard title="Revenue" value={1234567} icon={Users} />);

      expect(screen.getByText('1,234,567')).toBeInTheDocument();
    });

    it('handles zero value correctly', () => {
      render(<StatCard title="Errors" value={0} icon={Users} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles negative numbers correctly', () => {
      render(<StatCard title="Balance" value={-500} icon={Users} />);

      expect(screen.getByText('-500')).toBeInTheDocument();
    });
  });

  describe('Change Display - Positive', () => {
    it('renders positive change with green color', () => {
      render(<StatCard title="Total Users" value={150} change={12.5} icon={Users} />);

      const changeElement = screen.getByText('12.5%');
      // The parent div has the color class, the span is inside
      expect(changeElement.parentElement).toHaveClass('text-green-600');
    });

    it('displays up arrow for positive change', () => {
      const { container } = render(
        <StatCard title="Total Users" value={150} change={12.5} icon={Users} />
      );

      const trendingUpIcon = container.querySelector('.lucide-trending-up');
      expect(trendingUpIcon).toBeInTheDocument();
    });

    it('handles zero as positive change', () => {
      render(<StatCard title="Total Users" value={150} change={0} icon={Users} />);

      expect(screen.queryByText('0%')).not.toBeInTheDocument();
    });

    it('displays percentage symbol for positive change', () => {
      render(<StatCard title="Total Users" value={150} change={5.7} icon={Users} />);

      expect(screen.getByText('5.7%')).toBeInTheDocument();
    });

    it('renders large positive change correctly', () => {
      render(<StatCard title="Total Users" value={150} change={125} icon={Users} />);

      expect(screen.getByText('125%')).toBeInTheDocument();
    });
  });

  describe('Change Display - Negative', () => {
    it('renders negative change with red color', () => {
      render(<StatCard title="Total Users" value={150} change={-12.5} icon={Users} />);

      const changeElement = screen.getByText('12.5%');
      // The parent div has the color class, the span is inside
      expect(changeElement.parentElement).toHaveClass('text-red-600');
    });

    it('displays down arrow for negative change', () => {
      const { container } = render(
        <StatCard title="Total Users" value={150} change={-12.5} icon={Users} />
      );

      const trendingDownIcon = container.querySelector('.lucide-trending-down');
      expect(trendingDownIcon).toBeInTheDocument();
    });

    it('displays absolute value for negative change', () => {
      render(<StatCard title="Total Users" value={150} change={-8.3} icon={Users} />);

      expect(screen.getByText('8.3%')).toBeInTheDocument();
    });

    it('renders large negative change correctly', () => {
      render(<StatCard title="Total Users" value={150} change={-45.8} icon={Users} />);

      expect(screen.getByText('45.8%')).toBeInTheDocument();
    });

    it('does not display minus sign in percentage', () => {
      render(<StatCard title="Total Users" value={150} change={-12.5} icon={Users} />);

      expect(screen.queryByText('-12.5%')).not.toBeInTheDocument();
      expect(screen.getByText('12.5%')).toBeInTheDocument();
    });
  });

  describe('Zero Change Display', () => {
    it('does not render change section for zero change', () => {
      render(<StatCard title="Total Users" value={150} change={0} icon={Users} />);

      expect(screen.queryByText('0%')).not.toBeInTheDocument();
    });

    it('does not display trending icons for zero change', () => {
      const { container } = render(
        <StatCard title="Total Users" value={150} change={0} icon={Users} />
      );

      expect(container.querySelector('.lucide-trending-up')).not.toBeInTheDocument();
      expect(container.querySelector('.lucide-trending-down')).not.toBeInTheDocument();
    });
  });

  describe('Undefined Change Display', () => {
    it('handles undefined change gracefully', () => {
      render(<StatCard title="Total Users" value={150} icon={Users} />);

      expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    });

    it('does not render change section when change is undefined', () => {
      const { container } = render(<StatCard title="Total Users" value={150} icon={Users} />);

      expect(container.querySelector('.text-green-600')).not.toBeInTheDocument();
      expect(container.querySelector('.text-red-600')).not.toBeInTheDocument();
    });

    it('does not display trending icons when change is undefined', () => {
      const { container } = render(<StatCard title="Total Users" value={150} icon={Users} />);

      expect(container.querySelector('.lucide-trending-up')).not.toBeInTheDocument();
      expect(container.querySelector('.lucide-trending-down')).not.toBeInTheDocument();
    });
  });

  describe('Icon Display', () => {
    it('renders icon correctly', () => {
      const { container } = render(<StatCard title="Total Users" value={150} icon={Users} />);

      const icon = container.querySelector('.lucide-users');
      expect(icon).toBeInTheDocument();
    });

    it('displays icon with correct size', () => {
      const { container } = render(<StatCard title="Total Users" value={150} icon={Users} />);

      const icon = container.querySelector('.h-5.w-5');
      expect(icon).toBeInTheDocument();
    });

    it('icon is inside a rounded container', () => {
      const { container } = render(<StatCard title="Total Users" value={150} icon={Users} />);

      const iconContainer = container.querySelector('.p-2.rounded-lg');
      expect(iconContainer).toBeInTheDocument();
    });

    it('applies muted background when not highlighted', () => {
      const { container } = render(<StatCard title="Total Users" value={150} icon={Users} />);

      const iconContainer = container.querySelector('.bg-muted.text-muted-foreground');
      expect(iconContainer).toBeInTheDocument();
    });

    it('applies primary background when highlighted', () => {
      const { container } = render(
        <StatCard title="Total Users" value={150} icon={Users} highlight />
      );

      const iconContainer = container.querySelector('.bg-primary\\/10.text-primary');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Large Number Formatting', () => {
    it('formats thousands with commas', () => {
      render(<StatCard title="Revenue" value={5000} icon={Users} />);

      expect(screen.getByText('5,000')).toBeInTheDocument();
    });

    it('formats millions with commas', () => {
      render(<StatCard title="Revenue" value={1000000} icon={Users} />);

      expect(screen.getByText('1,000,000')).toBeInTheDocument();
    });

    it('formats complex numbers with commas', () => {
      render(<StatCard title="Revenue" value={1234567890} icon={Users} />);

      expect(screen.getByText('1,234,567,890')).toBeInTheDocument();
    });

    it('does not format string values', () => {
      render(<StatCard title="Status" value="$1,000,000" icon={Users} />);

      expect(screen.getByText('$1,000,000')).toBeInTheDocument();
    });
  });

  describe('Highlight Feature', () => {
    it('applies ring border when highlighted', () => {
      const { container } = render(
        <StatCard title="Total Users" value={150} icon={Users} highlight />
      );

      const card = container.querySelector('.ring-2.ring-primary');
      expect(card).toBeInTheDocument();
    });

    it('does not apply ring border when not highlighted', () => {
      const { container } = render(<StatCard title="Total Users" value={150} icon={Users} />);

      expect(container.querySelector('.ring-2')).not.toBeInTheDocument();
    });

    it('applies primary colors to icon when highlighted', () => {
      const { container } = render(
        <StatCard title="Total Users" value={150} icon={Users} highlight />
      );

      const iconContainer = container.querySelector('.bg-primary\\/10.text-primary');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('applies custom className to card', () => {
      const { container } = render(
        <StatCard title="Total Users" value={150} icon={Users} className="custom-class" />
      );

      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });

    it('combines custom className with other classes', () => {
      const { container } = render(
        <StatCard
          title="Total Users"
          value={150}
          icon={Users}
          highlight
          className="custom-class"
        />
      );

      const card = container.querySelector('.custom-class.ring-2.ring-primary');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure with paragraphs', () => {
      const { container } = render(<StatCard title="Total Users" value={150} icon={Users} />);

      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs.length).toBeGreaterThan(0);
    });

    it('title is accessible text', () => {
      render(<StatCard title="Total Users" value={150} icon={Users} />);

      const title = screen.getByText('Total Users');
      expect(title.tagName).toBe('P');
    });

    it('value is accessible text', () => {
      render(<StatCard title="Total Users" value={150} icon={Users} />);

      const value = screen.getByText('150');
      expect(value.tagName).toBe('P');
    });

    it('change percentage is accessible when present', () => {
      render(<StatCard title="Total Users" value={150} change={12.5} icon={Users} />);

      const changeText = screen.getByText('12.5%');
      expect(changeText).toBeVisible();
    });

    it('icon has accessible SVG attributes', () => {
      const { container } = render(<StatCard title="Total Users" value={150} icon={Users} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive padding classes', () => {
      const { container } = render(<StatCard title="Total Users" value={150} icon={Users} />);

      const cardContent = container.querySelector('.p-6');
      expect(cardContent).toBeInTheDocument();
    });

    it('uses flex layout for responsive content', () => {
      const { container } = render(<StatCard title="Total Users" value={150} icon={Users} />);

      const flexContainer = container.querySelector('.flex.items-center.justify-between');
      expect(flexContainer).toBeInTheDocument();
    });

    it('applies gap spacing for flex items', () => {
      const { container } = render(<StatCard title="Total Users" value={150} icon={Users} />);

      const flexContent = container.querySelector('.flex.items-center.gap-3');
      expect(flexContent).toBeInTheDocument();
    });

    it('maintains layout structure with all elements', () => {
      const { container } = render(
        <StatCard title="Total Users" value={150} change={12.5} icon={Users} />
      );

      const mainFlex = container.querySelector('.flex.items-center.justify-between');
      expect(mainFlex).toBeInTheDocument();
      expect(mainFlex?.children).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('handles very small decimal changes', () => {
      render(<StatCard title="Total Users" value={150} change={0.1} icon={Users} />);

      expect(screen.getByText('0.1%')).toBeInTheDocument();
    });

    it('handles very large changes', () => {
      render(<StatCard title="Total Users" value={150} change={999.9} icon={Users} />);

      expect(screen.getByText('999.9%')).toBeInTheDocument();
    });

    it('handles empty string value', () => {
      render(<StatCard title="Total Users" value="" icon={Users} />);

      expect(screen.getByText('Total Users')).toBeInTheDocument();
    });

    it('handles special characters in title', () => {
      render(<StatCard title="Users (Active & Pending)" value={150} icon={Users} />);

      expect(screen.getByText('Users (Active & Pending)')).toBeInTheDocument();
    });

    it('handles long title text', () => {
      const longTitle = 'This is a very long title that might wrap to multiple lines';
      render(<StatCard title={longTitle} value={150} icon={Users} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('handles decimal values correctly', () => {
      render(<StatCard title="Average Rating" value={4.5} icon={Users} />);

      expect(screen.getByText('4.5')).toBeInTheDocument();
    });
  });

  describe('Change Section Layout', () => {
    it('change section uses flex layout with gap', () => {
      const { container } = render(
        <StatCard title="Total Users" value={150} change={12.5} icon={Users} />
      );

      const changeSection = container.querySelector('.flex.items-center.gap-1');
      expect(changeSection).toBeInTheDocument();
    });

    it('change section has medium font weight', () => {
      const { container } = render(
        <StatCard title="Total Users" value={150} change={12.5} icon={Users} />
      );

      const changeSection = screen.getByText('12.5%').parentElement;
      expect(changeSection).toHaveClass('font-medium');
    });

    it('change section has small text size', () => {
      const { container } = render(
        <StatCard title="Total Users" value={150} change={12.5} icon={Users} />
      );

      const changeSection = screen.getByText('12.5%').parentElement;
      expect(changeSection).toHaveClass('text-sm');
    });

    it('trending icon has correct size in change section', () => {
      const { container } = render(
        <StatCard title="Total Users" value={150} change={12.5} icon={Users} />
      );

      const trendingIcon = container.querySelector('.h-4.w-4');
      expect(trendingIcon).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('renders complete card with all props', () => {
      render(
        <StatCard
          title="Total Users"
          value={1234}
          change={15.5}
          icon={Users}
          highlight
          className="test-class"
        />
      );

      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('1,234')).toBeInTheDocument();
      expect(screen.getByText('15.5%')).toBeInTheDocument();
    });

    it('renders minimal card with required props only', () => {
      render(<StatCard title="Status" value="Online" icon={Users} />);

      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('maintains structure when rendered multiple times', () => {
      const { rerender } = render(
        <StatCard title="Users" value={100} change={10} icon={Users} />
      );

      expect(screen.getByText('Users')).toBeInTheDocument();

      rerender(<StatCard title="Revenue" value={5000} change={-5} icon={Users} />);

      expect(screen.getByText('Revenue')).toBeInTheDocument();
      expect(screen.getByText('5,000')).toBeInTheDocument();
    });
  });
});
