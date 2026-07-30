'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  ArrowLeft,
  ChevronDown,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Sparkles,
  UserRound,
  Users,
  Clapperboard,
} from 'lucide-react';
import { ChangelogDialog } from '@/components/ChangelogDialog';
import { APP_VERSION } from '@/lib/changelog';
import { UserAvatar } from '@/components/UserAvatar';
import { StreakBadge } from '@/components/StreakBadge';

interface User {
  id: number;
  username: string;
  email: string;
  role?: string;
  avatar_hue?: number | null;
  streak?: number;
}

interface NavIcon {
  href: string;
  label: string;
  icon: typeof Clapperboard;
  adminOnly?: boolean;
}

// The whole primary nav — icons only, labels live in the tooltip/aria label.
const NAV_ICONS: NavIcon[] = [
  { href: '/videos', label: 'Videos', icon: Clapperboard },
  { href: '/requests', label: 'Requests', icon: Lightbulb },
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, adminOnly: true },
];

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
        if (pathname !== '/' && pathname !== '/login' && pathname !== '/register') {
          router.push('/login');
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('Logout failed');
      }

      setUser(null);

      setTimeout(() => {
        router.replace('/login');
      }, 100);

    } catch (error) {
      console.error('Logout error:', error);
      router.replace('/login');
    }
  };

  // Land straight on a deep link and there is nothing to go back to — fall
  // back to the home page rather than leaving the app.
  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const isAdmin = user?.role === 'admin';
  const isHomePage = pathname === '/';
  const isLoginPage = pathname === '/login';
  const isRegisterPage = pathname === '/register';

  if (loading) return null;
  if (isLoginPage || isRegisterPage || !user) return null;

  const menuItemClass =
    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-gray-300 transition-colors hover:bg-[#1c1c1c] hover:text-white';

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-gray-800">
        <div className="container mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
          {/* Back + wordmark */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {!isHomePage && (
              <button
                onClick={handleBack}
                title="Go back"
                aria-label="Go back"
                className="shrink-0 rounded-md p-2 text-gray-400 transition-colors hover:bg-[#111] hover:text-white cursor-pointer"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}

            <Link
              href="/"
              className="truncate text-base sm:text-xl font-bold tracking-tighter text-gray-400 transition-colors hover:text-white"
            >
              DARCE SIDE
            </Link>

            {/* On phones the version badge moves into the account menu */}
            <ChangelogDialog
              open={changelogOpen}
              onOpenChange={setChangelogOpen}
              triggerClassName="hidden sm:inline-flex"
            />
          </div>

          {/* Primary navigation */}
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
            {NAV_ICONS.filter((item) => !item.adminOnly || isAdmin).map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  aria-label={item.label}
                  className={`rounded-md p-2 transition-colors hover:bg-[#111] hover:text-white active:bg-[#1c1c1c] ${
                    isActive ? 'bg-[#111] text-white' : 'text-gray-400'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              );
            })}

            {/* Profile / members / logout */}
            <Popover open={menuOpen} onOpenChange={setMenuOpen}>
              <PopoverTrigger asChild>
                <button
                  aria-label="Account menu"
                  className="ml-0.5 flex shrink-0 items-center gap-1 rounded-md p-1 sm:pr-2 text-gray-400 transition-colors hover:bg-[#111] hover:text-white cursor-pointer"
                >
                  <UserAvatar
                    username={user.username}
                    hue={user.avatar_hue}
                    size={28}
                  />
                  <ChevronDown
                    className={`hidden h-4 w-4 transition-transform sm:block ${menuOpen ? 'rotate-180' : ''}`}
                  />
                </button>
              </PopoverTrigger>

              <PopoverContent
                align="end"
                sideOffset={8}
                collisionPadding={12}
                className="w-[calc(100vw-1.5rem)] max-w-60 border-gray-800 bg-[#111] p-1.5 text-gray-200"
              >
                <div className="flex items-center gap-3 px-3 py-2">
                  <UserAvatar
                    username={user.username}
                    hue={user.avatar_hue}
                    size={36}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {user.username}
                    </p>
                    <p className="text-xs text-gray-500">{user.role ?? 'user'}</p>
                  </div>
                </div>

                {!!user.streak && (
                  <div className="px-3 pb-2">
                    <StreakBadge days={user.streak} size="sm" />
                  </div>
                )}

                <div className="my-1 h-px bg-gray-800" />

                <Link href={`/users/${user.username}`} className={menuItemClass}>
                  <UserRound className="h-4 w-4" />
                  My profile
                </Link>

                <Link href="/users" className={menuItemClass}>
                  <Users className="h-4 w-4" />
                  Members
                </Link>

                <button
                  onClick={() => {
                    // Let the popover finish closing before the dialog takes
                    // over focus, otherwise Radix leaves the body inert.
                    setMenuOpen(false);
                    setTimeout(() => setChangelogOpen(true), 150);
                  }}
                  className={`w-full cursor-pointer sm:hidden ${menuItemClass}`}
                >
                  <Sparkles className="h-4 w-4" />
                  What’s new
                  <span className="ml-auto text-xs text-gray-500">v{APP_VERSION}</span>
                </button>

                <div className="my-1 h-px bg-gray-800" />

                <button
                  onClick={handleLogout}
                  className={`w-full cursor-pointer ${menuItemClass} text-red-400 hover:bg-red-950/30 hover:text-red-300`}
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-16" />
    </>
  );
}
