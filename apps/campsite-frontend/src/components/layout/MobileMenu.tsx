'use client';

import Link from 'next/link';
import { X, Tent, Home, Search, Heart, LayoutDashboard, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UserRole } from '@campsite/shared';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      phone?: string;
    };
  } | null;
  role: UserRole;
  wishlistCount: number;
  onSignOut: () => Promise<{ error: Error | null }>;
}

export function MobileMenu({ isOpen, onClose, user, role, wishlistCount, onSignOut }: MobileMenuProps) {
  const displayName = user?.user_metadata?.full_name || user?.email.split('@')[0];

  const handleSignOut = async () => {
    const { error } = await onSignOut();
    if (!error) {
      onClose();
      window.location.href = '/';
    }
  };

  const handleLinkClick = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full max-w-xs bg-background shadow-xl md:hidden',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <Link href="/" className="flex items-center gap-2" onClick={handleLinkClick}>
            <Tent className="h-6 w-6 text-green-600" />
            <span className="font-bold">Camping Thailand</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* User Info (if logged in) */}
        {user && (
          <div className="border-b p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white font-medium">
                {displayName?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex flex-col p-4 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
            onClick={handleLinkClick}
          >
            <Home className="h-5 w-5" />
            <div className="flex flex-col">
              <span>หน้าแรก</span>
              <span className="text-xs text-muted-foreground">Home</span>
            </div>
          </Link>

          <Link
            href="/search"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
            onClick={handleLinkClick}
          >
            <Search className="h-5 w-5" />
            <div className="flex flex-col">
              <span>ค้นหา</span>
              <span className="text-xs text-muted-foreground">Search</span>
            </div>
          </Link>

          {user && (
            <Link
              href="/wishlist"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
              onClick={handleLinkClick}
            >
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5" />
                <div className="flex flex-col">
                  <span>รายการโปรด</span>
                  <span className="text-xs text-muted-foreground">Wishlist</span>
                </div>
              </div>
              {wishlistCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] text-white">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </Link>
          )}

          {user && (role === 'owner' || role === 'admin') && (
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
              onClick={handleLinkClick}
            >
              <LayoutDashboard className="h-5 w-5" />
              <div className="flex flex-col">
                <span>แดชบอร์ด</span>
                <span className="text-xs text-muted-foreground">Dashboard</span>
              </div>
            </Link>
          )}

          {user && role === 'admin' && (
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
              onClick={handleLinkClick}
            >
              <Settings className="h-5 w-5" />
              <div className="flex flex-col">
                <span>จัดการระบบ</span>
                <span className="text-xs text-muted-foreground">Admin Panel</span>
              </div>
            </Link>
          )}
        </nav>

        {/* Auth Section */}
        <div className="absolute bottom-0 left-0 right-0 border-t p-4">
          {user ? (
            <Button
              variant="outline"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              ออกจากระบบ / Logout
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href="/auth/login" onClick={handleLinkClick}>
                  เข้าสู่ระบบ / Login
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/auth/signup" onClick={handleLinkClick}>
                  สมัครสมาชิก / Register
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
