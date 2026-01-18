import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalyticsChart } from '@/components/dashboard/AnalyticsChart';
import type { AnalyticsChartData } from '@campsite/shared';

describe('AnalyticsChart', () => {
  const mockData: AnalyticsChartData[] = [
    {
      date: '2026-01-01',
      search_impressions: 100,
      profile_views: 50,
      booking_clicks: 25,
      inquiries: 10,
    },
    {
      date: '2026-01-02',
      search_impressions: 120,
      profile_views: 60,
      booking_clicks: 30,
      inquiries: 15,
    },
    {
      date: '2026-01-03',
      search_impressions: 90,
      profile_views: 45,
      booking_clicks: 20,
      inquiries: 8,
    },
  ];

  describe('Rendering', () => {
    it('renders chart container', () => {
      const { container } = render(<AnalyticsChart data={mockData} title="Test Chart" />);

      const card = container.querySelector('[class*="card"]');
      expect(card).toBeInTheDocument();
    });

    it('renders chart title', () => {
      render(<AnalyticsChart data={mockData} title="Analytics Overview" />);

      expect(screen.getByText('Analytics Overview')).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      const { container } = render(
        <AnalyticsChart data={mockData} title="Test" className="custom-class" />
      );

      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('handles empty data array', () => {
      render(<AnalyticsChart data={[]} title="Empty Chart" />);

      expect(screen.getByText('Empty Chart')).toBeInTheDocument();
      expect(screen.getByText('No data available for this period')).toBeInTheDocument();
    });

    it('displays empty message in center of content area', () => {
      const { container } = render(<AnalyticsChart data={[]} title="Test" />);

      const emptyMessage = screen.getByText('No data available for this period');
      expect(emptyMessage).toHaveClass('text-muted-foreground');

      // Find the container with flex centering (div inside CardContent)
      const flexContainer = container.querySelector('.flex.items-center.justify-center.h-64');
      expect(flexContainer).toBeInTheDocument();
      expect(flexContainer).toContainElement(emptyMessage);
    });

    it('does not render legend when data is empty', () => {
      render(<AnalyticsChart data={[]} title="Test" />);

      expect(screen.queryByText('Search Impressions')).not.toBeInTheDocument();
      expect(screen.queryByText('Profile Views')).not.toBeInTheDocument();
      expect(screen.queryByText('Booking Clicks')).not.toBeInTheDocument();
      expect(screen.queryByText('Inquiries')).not.toBeInTheDocument();
    });
  });

  describe('Data Rendering', () => {
    it('renders with 30 data points', () => {
      const thirtyDaysData: AnalyticsChartData[] = Array.from({ length: 30 }, (_, i) => ({
        date: `2026-01-${String(i + 1).padStart(2, '0')}`,
        search_impressions: Math.floor(Math.random() * 200),
        profile_views: Math.floor(Math.random() * 100),
        booking_clicks: Math.floor(Math.random() * 50),
        inquiries: Math.floor(Math.random() * 20),
      }));

      const { container } = render(
        <AnalyticsChart data={thirtyDaysData} title="30 Days Chart" />
      );

      const bars = container.querySelectorAll('.group.relative');
      expect(bars).toHaveLength(30);
    });

    it('renders correct number of bar groups for data points', () => {
      const { container } = render(<AnalyticsChart data={mockData} title="Test" />);

      const barGroups = container.querySelectorAll('.group.relative');
      expect(barGroups).toHaveLength(mockData.length);
    });

    it('renders four metric bars per data point', () => {
      const { container } = render(<AnalyticsChart data={mockData} title="Test" />);

      const barGroups = container.querySelectorAll('.group.relative');
      barGroups.forEach((group) => {
        const bars = group.querySelectorAll('.flex-1.rounded-t');
        expect(bars).toHaveLength(4);
      });
    });

    it('applies correct color classes to bars', () => {
      const { container } = render(<AnalyticsChart data={mockData} title="Test" />);

      const barGroup = container.querySelector('.group.relative');
      const bars = barGroup?.querySelectorAll('.flex-1.rounded-t');

      expect(bars?.[0]).toHaveClass('bg-blue-500');
      expect(bars?.[1]).toHaveClass('bg-green-500');
      expect(bars?.[2]).toHaveClass('bg-orange-500');
      expect(bars?.[3]).toHaveClass('bg-purple-500');
    });
  });

  describe('Legend Display', () => {
    it('displays all legend items correctly', () => {
      render(<AnalyticsChart data={mockData} title="Test" />);

      expect(screen.getByText('Search Impressions')).toBeInTheDocument();
      expect(screen.getByText('Profile Views')).toBeInTheDocument();
      expect(screen.getByText('Booking Clicks')).toBeInTheDocument();
      expect(screen.getByText('Inquiries')).toBeInTheDocument();
    });

    it('renders legend color indicators', () => {
      const { container } = render(<AnalyticsChart data={mockData} title="Test" />);

      const colorIndicators = container.querySelectorAll('.w-3.h-3.rounded');
      expect(colorIndicators).toHaveLength(4);

      expect(colorIndicators[0]).toHaveClass('bg-blue-500');
      expect(colorIndicators[1]).toHaveClass('bg-green-500');
      expect(colorIndicators[2]).toHaveClass('bg-orange-500');
      expect(colorIndicators[3]).toHaveClass('bg-purple-500');
    });

    it('legend items have proper structure and styling', () => {
      const { container } = render(<AnalyticsChart data={mockData} title="Test" />);

      const legendItems = container.querySelectorAll('.flex.items-center.gap-2');
      expect(legendItems.length).toBeGreaterThanOrEqual(4);

      legendItems.forEach((item) => {
        const indicator = item.querySelector('.w-3.h-3.rounded');
        const label = item.querySelector('.text-muted-foreground');
        expect(indicator).toBeInTheDocument();
        expect(label).toBeInTheDocument();
      });
    });
  });

  describe('Tooltip on Hover', () => {
    it('tooltip exists in DOM for each bar group', () => {
      const { container } = render(<AnalyticsChart data={mockData} title="Test" />);

      const tooltips = container.querySelectorAll('.absolute.bottom-full');
      expect(tooltips).toHaveLength(mockData.length);
    });

    it('tooltip is hidden by default', () => {
      const { container } = render(<AnalyticsChart data={mockData} title="Test" />);

      const tooltip = container.querySelector('.absolute.bottom-full');
      expect(tooltip).toHaveClass('hidden');
    });

    it('tooltip shows on hover via group-hover class', () => {
      const { container } = render(<AnalyticsChart data={mockData} title="Test" />);

      const tooltip = container.querySelector('.absolute.bottom-full');
      expect(tooltip).toHaveClass('group-hover:block');
    });

    it('tooltip displays date label', async () => {
      const { container } = render(<AnalyticsChart data={mockData} title="Test" />);

      const tooltips = container.querySelectorAll('.absolute.bottom-full');
      const firstTooltip = tooltips[0];

      // Check if tooltip contains formatted date
      expect(firstTooltip.textContent).toContain('ม.ค.'); // Thai locale month abbreviation
    });

    it('tooltip displays all metric values', () => {
      const { container } = render(<AnalyticsChart data={mockData} title="Test" />);

      const tooltip = container.querySelector('.absolute.bottom-full');
      expect(tooltip?.textContent).toContain('Impressions:');
      expect(tooltip?.textContent).toContain('Views:');
      expect(tooltip?.textContent).toContain('Clicks:');
      expect(tooltip?.textContent).toContain('Inquiries:');
    });

    it('tooltip shows correct raw values for data point', () => {
      const { container } = render(<AnalyticsChart data={mockData} title="Test" />);

      const tooltips = container.querySelectorAll('.absolute.bottom-full');
      const firstTooltip = tooltips[0];

      expect(firstTooltip.textContent).toContain('100'); // search_impressions
      expect(firstTooltip.textContent).toContain('50'); // profile_views
      expect(firstTooltip.textContent).toContain('25'); // booking_clicks
      expect(firstTooltip.textContent).toContain('10'); // inquiries
    });
  });

  describe('Responsive Container', () => {
    it('chart container has fixed height', () => {
      const { container } = render(<AnalyticsChart data={mockData} title="Test" />);

      const chartContainer = container.querySelector('.h-64');
      expect(chartContainer).toBeInTheDocument();
      expect(chartContainer).toHaveClass('h-64');
    });

    it('chart uses flex layout for bars', () => {
      const { container } = render(<AnalyticsChart data={mockData} title="Test" />);

      const chartContainer = container.querySelector('.h-64');
      expect(chartContainer).toHaveClass('flex', 'items-end', 'gap-1');
    });

    it('each bar group is flex-1 for equal distribution', () => {
      const { container } = render(<AnalyticsChart data={mockData} title="Test" />);

      const barGroups = container.querySelectorAll('.group.relative');
      barGroups.forEach((group) => {
        expect(group).toHaveClass('flex-1');
      });
    });

    it('bars within group use percentage heights', () => {
      const { container } = render(<AnalyticsChart data={mockData} title="Test" />);

      const firstBarGroup = container.querySelector('.group.relative');
      const bars = firstBarGroup?.querySelectorAll('.flex-1.rounded-t');

      bars?.forEach((bar) => {
        const style = bar.getAttribute('style');
        expect(style).toContain('height:');
        expect(style).toContain('%');
      });
    });
  });

  describe('Data Normalization', () => {
    it('normalizes bar heights based on max value', () => {
      const dataWithMaxValue: AnalyticsChartData[] = [
        {
          date: '2026-01-01',
          search_impressions: 100,
          profile_views: 50,
          booking_clicks: 25,
          inquiries: 10,
        },
      ];

      const { container } = render(
        <AnalyticsChart data={dataWithMaxValue} title="Test" />
      );

      const bars = container.querySelectorAll('.flex-1.rounded-t');
      const tallestBar = bars[0]; // search_impressions (100) should be 100%
      const style = tallestBar.getAttribute('style');

      expect(style).toContain('height: 100%');
    });

    it('handles zero values with minimum height', () => {
      const dataWithZeros: AnalyticsChartData[] = [
        {
          date: '2026-01-01',
          search_impressions: 100,
          profile_views: 0,
          booking_clicks: 0,
          inquiries: 0,
        },
      ];

      const { container } = render(<AnalyticsChart data={dataWithZeros} title="Test" />);

      const barGroup = container.querySelector('.group.relative');
      const bars = barGroup?.querySelectorAll('.flex-1.rounded-t');

      // Zero values should have 0 minHeight (min-height: 0)
      expect(bars?.[1].getAttribute('style')).toContain('min-height: 0');
      expect(bars?.[2].getAttribute('style')).toContain('min-height: 0');
      expect(bars?.[3].getAttribute('style')).toContain('min-height: 0');
    });

    it('handles non-zero values with minimum height', () => {
      const dataWithSmallValues: AnalyticsChartData[] = [
        {
          date: '2026-01-01',
          search_impressions: 100,
          profile_views: 1,
          booking_clicks: 1,
          inquiries: 1,
        },
      ];

      const { container } = render(
        <AnalyticsChart data={dataWithSmallValues} title="Test" />
      );

      const barGroup = container.querySelector('.group.relative');
      const bars = barGroup?.querySelectorAll('.flex-1.rounded-t');

      // Non-zero values should have 2px minHeight (min-height: 2px)
      expect(bars?.[1].getAttribute('style')).toContain('min-height: 2px');
      expect(bars?.[2].getAttribute('style')).toContain('min-height: 2px');
      expect(bars?.[3].getAttribute('style')).toContain('min-height: 2px');
    });
  });

  describe('Date Labels', () => {
    it('shows labels every 7 days', () => {
      const fourteenDaysData: AnalyticsChartData[] = Array.from({ length: 14 }, (_, i) => ({
        date: `2026-01-${String(i + 1).padStart(2, '0')}`,
        search_impressions: 50,
        profile_views: 25,
        booking_clicks: 10,
        inquiries: 5,
      }));

      const { container } = render(
        <AnalyticsChart data={fourteenDaysData} title="Test" />
      );

      const labels = container.querySelectorAll('.text-xs.text-muted-foreground.mt-1');
      // Labels at index 0, 7, 14 - but we have 14 items, so 0 and 7
      expect(labels.length).toBe(2);
    });

    it('formats date labels in Thai locale', () => {
      const { container } = render(<AnalyticsChart data={mockData} title="Test" />);

      const label = container.querySelector('.text-xs.text-muted-foreground.mt-1');
      // Thai locale should include month abbreviation like ม.ค. (Jan)
      expect(label?.textContent).toMatch(/\d+\s+\S+/);
    });

    it('truncates labels to prevent overflow', () => {
      const { container } = render(<AnalyticsChart data={mockData} title="Test" />);

      const labels = container.querySelectorAll('.text-xs.text-muted-foreground.mt-1');
      labels.forEach((label) => {
        expect(label).toHaveClass('truncate', 'max-w-full');
      });
    });
  });

  describe('Accessibility', () => {
    it('uses semantic HTML card structure', () => {
      const { container } = render(<AnalyticsChart data={mockData} title="Test Chart" />);

      const card = container.querySelector('[class*="card"]');
      expect(card).toBeInTheDocument();
    });

    it('tooltip has proper z-index for visibility', () => {
      const { container } = render(<AnalyticsChart data={mockData} title="Test" />);

      const tooltip = container.querySelector('.absolute.bottom-full');
      expect(tooltip).toHaveClass('z-10');
    });

    it('applies transition effects for hover states', () => {
      const { container } = render(<AnalyticsChart data={mockData} title="Test" />);

      const bars = container.querySelectorAll('.flex-1.rounded-t');
      bars.forEach((bar) => {
        expect(bar).toHaveClass('transition-all');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles single data point', () => {
      const singleData: AnalyticsChartData[] = [
        {
          date: '2026-01-01',
          search_impressions: 100,
          profile_views: 50,
          booking_clicks: 25,
          inquiries: 10,
        },
      ];

      const { container } = render(<AnalyticsChart data={singleData} title="Test" />);

      const barGroups = container.querySelectorAll('.group.relative');
      expect(barGroups).toHaveLength(1);
    });

    it('handles all metrics at same value', () => {
      const uniformData: AnalyticsChartData[] = [
        {
          date: '2026-01-01',
          search_impressions: 50,
          profile_views: 50,
          booking_clicks: 50,
          inquiries: 50,
        },
      ];

      const { container } = render(<AnalyticsChart data={uniformData} title="Test" />);

      const bars = container.querySelectorAll('.flex-1.rounded-t');
      bars.forEach((bar) => {
        const style = bar.getAttribute('style');
        expect(style).toContain('height: 100%');
      });
    });

    it('handles very large numbers', () => {
      const largeNumberData: AnalyticsChartData[] = [
        {
          date: '2026-01-01',
          search_impressions: 1000000,
          profile_views: 500000,
          booking_clicks: 250000,
          inquiries: 100000,
        },
      ];

      const { container } = render(
        <AnalyticsChart data={largeNumberData} title="Test" />
      );

      const tooltip = container.querySelector('.absolute.bottom-full');
      expect(tooltip?.textContent).toContain('1000000');
      expect(tooltip?.textContent).toContain('500000');
    });

    it('handles dates in different formats', () => {
      const differentDateData: AnalyticsChartData[] = [
        {
          date: '2026-01-15',
          search_impressions: 100,
          profile_views: 50,
          booking_clicks: 25,
          inquiries: 10,
        },
      ];

      render(<AnalyticsChart data={differentDateData} title="Test" />);

      // Should not throw and should render
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('renders complete chart with all elements', () => {
      const { container } = render(<AnalyticsChart data={mockData} title="Complete Chart" />);

      // Title
      expect(screen.getByText('Complete Chart')).toBeInTheDocument();

      // Legend
      expect(screen.getByText('Search Impressions')).toBeInTheDocument();
      expect(screen.getByText('Profile Views')).toBeInTheDocument();
      expect(screen.getByText('Booking Clicks')).toBeInTheDocument();
      expect(screen.getByText('Inquiries')).toBeInTheDocument();

      // Chart area
      const chartContainer = container.querySelector('.h-64');
      expect(chartContainer).toBeInTheDocument();
    });

    it('maintains data integrity through useMemo', () => {
      const { rerender } = render(<AnalyticsChart data={mockData} title="Test" />);

      // Re-render with same data
      rerender(<AnalyticsChart data={mockData} title="Test" />);

      const { container } = render(<AnalyticsChart data={mockData} title="Test" />);
      const barGroups = container.querySelectorAll('.group.relative');
      expect(barGroups).toHaveLength(mockData.length);
    });

    it('updates when data changes', () => {
      const { rerender, container: initialContainer } = render(
        <AnalyticsChart data={mockData} title="Test" />
      );

      const initialBars = initialContainer.querySelectorAll('.group.relative');
      expect(initialBars).toHaveLength(3);

      const newData: AnalyticsChartData[] = [
        ...mockData,
        {
          date: '2026-01-04',
          search_impressions: 80,
          profile_views: 40,
          booking_clicks: 15,
          inquiries: 5,
        },
      ];

      rerender(<AnalyticsChart data={newData} title="Test" />);

      const { container: updatedContainer } = render(
        <AnalyticsChart data={newData} title="Test" />
      );
      const updatedBars = updatedContainer.querySelectorAll('.group.relative');
      expect(updatedBars).toHaveLength(4);
    });
  });
});
