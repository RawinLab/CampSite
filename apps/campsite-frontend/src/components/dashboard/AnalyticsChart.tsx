'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalyticsChartData } from '@campsite/shared';

interface AnalyticsChartProps {
  data: AnalyticsChartData[];
  title: string;
  className?: string;
}

export function AnalyticsChart({ data, title, className }: AnalyticsChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) return { maxValue: 0, bars: [] };

    const maxValue = Math.max(
      ...data.map((d) =>
        Math.max(d.search_impressions, d.profile_views, d.booking_clicks, d.inquiries)
      ),
      1
    );

    const bars = data.map((d) => ({
      date: d.date,
      label: new Date(d.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
      impressions: (d.search_impressions / maxValue) * 100,
      views: (d.profile_views / maxValue) * 100,
      clicks: (d.booking_clicks / maxValue) * 100,
      inquiries: (d.inquiries / maxValue) * 100,
      raw: d,
    }));

    return { maxValue, bars };
  }, [data]);

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No data available for this period
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-muted-foreground">Search Impressions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-muted-foreground">Profile Views</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-500" />
            <span className="text-muted-foreground">Booking Clicks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-500" />
            <span className="text-muted-foreground">Inquiries</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-end gap-1">
          {chartData.bars.map((bar, idx) => (
            <div
              key={bar.date}
              className="flex-1 flex flex-col items-center gap-1 group relative"
            >
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 bg-popover text-popover-foreground shadow-md rounded-lg p-2 text-xs whitespace-nowrap">
                <p className="font-medium">{bar.label}</p>
                <p>Impressions: {bar.raw.search_impressions}</p>
                <p>Views: {bar.raw.profile_views}</p>
                <p>Clicks: {bar.raw.booking_clicks}</p>
                <p>Inquiries: {bar.raw.inquiries}</p>
              </div>

              {/* Bars */}
              <div className="w-full flex gap-0.5 h-full items-end">
                <div
                  className="flex-1 bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                  style={{ height: `${bar.impressions}%`, minHeight: bar.impressions > 0 ? '2px' : '0' }}
                />
                <div
                  className="flex-1 bg-green-500 rounded-t transition-all hover:bg-green-600"
                  style={{ height: `${bar.views}%`, minHeight: bar.views > 0 ? '2px' : '0' }}
                />
                <div
                  className="flex-1 bg-orange-500 rounded-t transition-all hover:bg-orange-600"
                  style={{ height: `${bar.clicks}%`, minHeight: bar.clicks > 0 ? '2px' : '0' }}
                />
                <div
                  className="flex-1 bg-purple-500 rounded-t transition-all hover:bg-purple-600"
                  style={{ height: `${bar.inquiries}%`, minHeight: bar.inquiries > 0 ? '2px' : '0' }}
                />
              </div>

              {/* Label (show every 7 days for better readability) */}
              {idx % 7 === 0 && (
                <span className="text-xs text-muted-foreground mt-1 truncate max-w-full">
                  {bar.label}
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
