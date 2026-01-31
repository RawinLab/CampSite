'use client';

import Link from 'next/link';
import { X, Tent, Home, Search, Heart, LayoutDashboard, Settings, LogOut, MapPin, User } from 'lucide-react';
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

  const navItems = [
    { href: '/', icon: Home, label: 'หน้าแรก', active: false },
    { href: '/search', icon: Search, label: 'ค้นหา', active: false },
    { href: '/provinces', icon: MapPin, label: 'จังหวัด', active: false },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl md:hidden',
          'transform transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-4 bg-[#F7F5F0]">
          <Link href="/" className="flex items-center gap-2.5" onClick={handleLinkClick}>
            <div className="w-10 h-10 rounded-xl bg-[#2D5A3D] flex items-center justify-center">
              <Tent className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-[#2B2D42]">Camping Thailand</span>
              <p className="text-[10px] text-gray-400">ค้นหาแคมป์ไซต์ทั่วไทย</p>
            </div>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="rounded-full hover:bg-gray-200"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User Info (if logged in) */}
        {user && (
          <div className="border-b border-gray-100 p-4 bg-gradient-to-r from-[#2D5A3D]/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2D5A3D] text-white font-bold text-lg">
                {displayName?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#2B2D42] truncate">{displayName}</p>
                <p className="text-sm text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex flex-col p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 hover:bg-[#2D5A3D]/10 hover:text-[#2D5A3D] transition-colors"
                onClick={handleLinkClick}
              >
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-base">{item.label}</span>
              </Link>
            );
          })}

          {user && (
            <Link
              href="/wishlist"
              className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-gray-600 hover:bg-[#E07A5F]/10 hover:text-[#E07A5F] transition-colors"
              onClick={handleLinkClick}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Heart className="h-5 w-5" />
                </div>
                <span className="text-base">รายการโปรด</span>
              </div>
              {wishlistCount > 0 && (
                <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#E07A5F] px-2 text-xs font-bold text-white">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </Link>
          )}

          {/* Divider */}
          <div className="border-t border-gray-100 my-2" />

          {user && (role === 'owner' || role === 'admin') && (
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 hover:bg-[#2D5A3D]/10 hover:text-[#2D5A3D] transition-colors"
              onClick={handleLinkClick}
            >
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <span className="text-base">แดชบอร์ด</span>
            </Link>
          )}

          {user && role === 'admin' && (
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 hover:bg-[#2D5A3D]/10 hover:text-[#2D5A3D] transition-colors"
              onClick={handleLinkClick}
            >
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <Settings className="h-5 w-5" />
              </div>
              <span className="text-base">จัดการระบบ</span>
            </Link>
          )}

          {user && (
            <Link
              href="/profile"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 hover:bg-[#2D5A3D]/10 hover:text-[#2D5A3D] transition-colors"
              onClick={handleLinkClick}
            >
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <span className="text-base">โปรไฟล์</span>
            </Link>
          )}
        </nav>

        {/* Auth Section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 p-4 bg-white">
          {user ? (
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-5 w-5" />
              ออกจากระบบ
            </Button>
          ) : (
            <div className="flex flex-col gap-3">
              <Button 
                asChild 
                className="w-full h-12 rounded-xl bg-[#2D5A3D] hover:bg-[#1e3d29] text-white"
              >
                <Link href="/auth/login" onClick={handleLinkClick}>
                  เข้าสู่ระบบ
                </Link>
              </Button>
              <Button 
                variant="outline" 
                asChild 
                className="w-full h-12 rounded-xl border-[#2D5A3D] text-[#2D5A3D] hover:bg-[#2D5A3D]/10"
              >
                <Link href="/auth/signup" onClick={handleLinkClick}>
                  สมัครสมาชิก
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
