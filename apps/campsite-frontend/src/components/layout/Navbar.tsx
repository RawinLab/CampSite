'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tent, Menu, Heart, Search, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/hooks/useWishlist';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { UserMenu } from './UserMenu';
import { MobileMenu } from './MobileMenu';

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const pathname = usePathname();
  const { user, role, loading, signOut } = useAuth();
  const { count, isLoading: wishlistLoading } = useWishlist();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Don't show navbar on dashboard or admin pages (they have their own layouts)
  if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin')) {
    return null;
  }

  const navLinks = [
    { href: '/', label: 'หน้าแรก', icon: Tent },
    { href: '/search', label: 'ค้นหา', icon: Search },
    { href: '/provinces', label: 'จังหวัด', icon: MapPin },
  ];

  const isActiveLink = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/90 shadow-sm',
        className
      )}
    >
      <div className="container flex h-18 items-center justify-between py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-[#2D5A3D] flex items-center justify-center group-hover:bg-[#1e3d29] transition-colors duration-200">
            <Tent className="h-5 w-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-lg text-[#2B2D42] leading-tight">Camping Thailand</span>
            <p className="text-[10px] text-gray-400 -mt-0.5">ค้นหาแคมป์ไซต์ทั่วไทย</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-gray-50/80 rounded-full p-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = isActiveLink(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-[#2D5A3D] text-white shadow-md'
                    : 'text-gray-600 hover:text-[#2D5A3D] hover:bg-white'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-gray-400')} />
                <span>{link.label}</span>
              </Link>
            );
          })}

          {user && (
            <Link
              href="/wishlist"
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 relative',
                isActiveLink('/wishlist')
                  ? 'bg-[#E07A5F] text-white shadow-md'
                  : 'text-gray-600 hover:text-[#E07A5F] hover:bg-white'
              )}
            >
              <Heart className={cn('h-4 w-4', isActiveLink('/wishlist') ? 'text-white fill-white' : '')} />
              <span>รายการโปรด</span>
              {!wishlistLoading && count > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white border-2 border-white">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
          )}
        </nav>

        {/* Desktop Auth Section */}
        <div className="hidden md:flex items-center gap-2">
          {loading ? (
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-24 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          ) : user ? (
            <UserMenu
              user={user}
              role={role}
              wishlistCount={count}
              onSignOut={signOut}
            />
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                asChild
                className="rounded-full px-5 text-gray-600 hover:text-[#2D5A3D] hover:bg-[#2D5A3D]/10"
              >
                <Link href="/auth/login">เข้าสู่ระบบ</Link>
              </Button>
              <Button 
                asChild
                className="rounded-full px-5 bg-[#2D5A3D] hover:bg-[#1e3d29] text-white shadow-md hover:shadow-lg transition-all"
              >
                <Link href="/auth/signup">สมัครสมาชิก</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Section */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Mobile Wishlist Icon (if logged in) */}
          {user && (
            <Link
              href="/wishlist"
              className={cn(
                'relative p-2.5 rounded-full transition-colors',
                isActiveLink('/wishlist')
                  ? 'bg-[#E07A5F] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <Heart className={cn('h-5 w-5', isActiveLink('/wishlist') ? 'fill-white' : '')} />
              {!wishlistLoading && count > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white border-2 border-white">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Link>
          )}

          {/* Hamburger Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
            className="rounded-full h-10 w-10 bg-gray-100 hover:bg-gray-200"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        role={role}
        wishlistCount={count}
        onSignOut={signOut}
      />
    </header>
  );
}

export default Navbar;
