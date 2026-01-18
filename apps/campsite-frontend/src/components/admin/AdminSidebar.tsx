'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Tent,
  Users,
  MessageSquareWarning,
  Settings,
  LogOut,
  MapPin,
} from 'lucide-react';

interface AdminSidebarProps {
  pendingCampsites?: number;
  pendingOwnerRequests?: number;
  reportedReviews?: number;
  pendingGooglePlaces?: number;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export function AdminSidebar({
  pendingCampsites = 0,
  pendingOwnerRequests = 0,
  reportedReviews = 0,
  pendingGooglePlaces = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      href: '/admin',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      href: '/admin/campsites/pending',
      label: 'Pending Campsites',
      icon: Tent,
      badge: pendingCampsites,
    },
    {
      href: '/admin/owner-requests',
      label: 'Owner Requests',
      icon: Users,
      badge: pendingOwnerRequests,
    },
    {
      href: '/admin/reviews/reported',
      label: 'Reported Reviews',
      icon: MessageSquareWarning,
      badge: reportedReviews,
    },
    {
      href: '/admin/google-places',
      label: 'Google Places',
      icon: MapPin,
      badge: pendingGooglePlaces,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/admin" className="flex items-center space-x-2">
            <Tent className="h-6 w-6 text-green-600" />
            <span className="font-bold text-gray-900">Admin Panel</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      active ? 'text-green-600' : 'text-gray-400'
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge
                    variant={active ? 'default' : 'secondary'}
                    className={cn(
                      'ml-auto',
                      active && 'bg-green-600 hover:bg-green-700'
                    )}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-3">
          <Link
            href="/"
            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            <LogOut className="h-5 w-5 text-gray-400" />
            <span>Back to Site</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
