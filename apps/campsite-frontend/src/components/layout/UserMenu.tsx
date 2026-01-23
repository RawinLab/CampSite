'use client';

import Link from 'next/link';
import { User, Heart, LayoutDashboard, Settings, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { UserRole } from '@campsite/shared';

interface UserMenuProps {
  user: {
    id: string;
    email: string;
    display_name?: string;
  };
  role: UserRole;
  wishlistCount: number;
  onSignOut: () => Promise<{ error: Error | null }>;
}

export function UserMenu({ user, role, wishlistCount, onSignOut }: UserMenuProps) {
  const displayName = user.display_name || user.email.split('@')[0];
  const initial = displayName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    const { error } = await onSignOut();
    if (!error) {
      window.location.href = '/';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white text-sm font-medium">
            {initial}
          </div>
          <span className="hidden lg:inline text-sm font-medium max-w-[120px] truncate">
            {displayName}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/wishlist" className="flex items-center justify-between w-full cursor-pointer">
              <div className="flex items-center">
                <Heart className="mr-2 h-4 w-4" />
                <span>รายการโปรด / Wishlist</span>
              </div>
              {wishlistCount > 0 && (
                <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] text-white">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </Link>
          </DropdownMenuItem>
          {(role === 'owner' || role === 'admin') && (
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="cursor-pointer">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>แดชบอร์ด / Dashboard</span>
              </Link>
            </DropdownMenuItem>
          )}
          {role === 'admin' && (
            <DropdownMenuItem asChild>
              <Link href="/admin" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Admin Panel</span>
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>ออกจากระบบ / Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
