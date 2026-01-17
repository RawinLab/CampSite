import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  LayoutDashboard,
  Tent,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/campsites', label: 'Campsites', icon: Tent },
  { href: '/dashboard/inquiries', label: 'Inquiries', icon: MessageSquare },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
];

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login?redirect=/dashboard');
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_role, full_name')
    .eq('id', session.user.id)
    .single();

  if (!profile || (profile.user_role !== 'owner' && profile.user_role !== 'admin')) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top navbar */}
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <Tent className="h-6 w-6 text-primary" />
              <span className="hidden sm:inline">Camping Thailand</span>
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground hidden sm:inline" />
            <span className="text-muted-foreground hidden sm:inline">Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:inline">
              {profile.full_name || session.user.email}
            </span>
            <form action="/auth/logout" method="post">
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <div className="flex gap-6">
          {/* Sidebar navigation */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <nav className="sticky top-24 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Mobile bottom navigation */}
          <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background md:hidden">
            <div className="flex items-center justify-around py-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center gap-1 px-3 py-2 text-muted-foreground hover:text-foreground"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>

          {/* Main content */}
          <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
