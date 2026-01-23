'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tent, Menu, Heart } from 'lucide-react';
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
    { href: '/', labelTh: 'หน้าแรก', labelEn: 'Home' },
    { href: '/search', labelTh: 'ค้นหา', labelEn: 'Search' },
  ];

  const isActiveLink = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Tent className="h-6 w-6 text-green-600" />
          <span className="hidden sm:inline">Camping Thailand</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex flex-col items-center px-4 py-2 rounded-md text-sm font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActiveLink(link.href)
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground'
              )}
            >
              <span>{link.labelTh}</span>
              <span className="text-[10px] text-muted-foreground">{link.labelEn}</span>
            </Link>
          ))}

          {user && (
            <Link
              href="/wishlist"
              className={cn(
                'relative flex flex-col items-center px-4 py-2 rounded-md text-sm font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActiveLink('/wishlist')
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground'
              )}
            >
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span>รายการโปรด</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Wishlist</span>
              {!wishlistLoading && count > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
          )}
        </nav>

        {/* Desktop Auth Section */}
        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-8 rounded-full" />
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
              <Button variant="ghost" asChild>
                <Link href="/auth/login" className="flex flex-col items-center">
                  <span>เข้าสู่ระบบ</span>
                  <span className="text-[10px] text-muted-foreground">Login</span>
                </Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup" className="flex flex-col items-center">
                  <span>สมัครสมาชิก</span>
                  <span className="text-[10px] text-white/80">Register</span>
                </Link>
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
              className="relative p-2 rounded-md hover:bg-accent"
            >
              <Heart className={cn('h-5 w-5', isActiveLink('/wishlist') ? 'fill-red-500 text-red-500' : '')} />
              {!wishlistLoading && count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] text-white">
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
          >
            <Menu className="h-6 w-6" />
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
