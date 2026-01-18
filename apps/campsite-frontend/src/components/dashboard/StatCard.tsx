'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Search, Eye, MousePointer, MessageSquare } from 'lucide-react';
import type { ReactNode } from 'react';

// Map of icon names to components for Server Component compatibility
const iconMap = {
  search: Search,
  eye: Eye,
  'mouse-pointer': MousePointer,
  'message-square': MessageSquare,
} as const;

type IconName = keyof typeof iconMap;

interface StatCardProps {
  title: string;
  value: number | string;
  change?: number;
  iconName?: IconName;
  iconElement?: ReactNode;
  highlight?: boolean;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  iconName,
  iconElement,
  highlight = false,
  className,
}: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const hasChange = change !== undefined && change !== 0;

  // Get the icon component from the name, or use the passed element
  const Icon = iconName ? iconMap[iconName] : null;

  return (
    <Card className={cn(highlight && 'ring-2 ring-primary', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'p-2 rounded-lg',
                highlight ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              )}
            >
              {Icon ? <Icon className="h-5 w-5" /> : iconElement}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
            </div>
          </div>
          {hasChange && (
            <div
              className={cn(
                'flex items-center gap-1 text-sm font-medium',
                isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
