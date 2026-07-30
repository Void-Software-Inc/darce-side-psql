'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, CalendarDays, Clock, Heart, MessageSquare } from 'lucide-react';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { UserAvatar } from '@/components/UserAvatar';
import { StreakBadge } from '@/components/StreakBadge';
import { timeAgo, formatDateTime, isOnline } from '@/lib/time';

interface User {
  username: string;
  created_at: string;
  likes_given: number;
  comments_count: number;
  role: string;
  team: string;
  created_requests_count: number;
  avatar_hue: number | null;
  last_login: string | null;
  last_seen: string | null;
  streak: number;
}

const SORT_OPTIONS = [
  { value: 'recent', label: 'Last login' },
  { value: 'streak', label: 'Streak' },
  { value: 'joined', label: 'Newest' },
  { value: 'name', label: 'Name' },
] as const;

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  usersPerPage: number;
}

// SearchComponent that uses useSearchParams
function SearchComponent({ onSearch }: { onSearch: (query: string) => void }) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  return (
    <div className="relative w-full sm:w-96">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        type="text"
        placeholder="Search users..."
        defaultValue={initialQuery}
        onChange={(e) => onSearch(e.target.value)}
        className="pl-10 bg-[#111] border-gray-800 text-gray-200 w-full"
      />
    </div>
  );
}

// UsersContent component that uses useSearchParams
function UsersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'recent');
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: parseInt(searchParams.get('page') || '1'),
    totalPages: 1,
    totalUsers: 0,
    usersPerPage: 12
  });

  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchUsers = async (page: number, search: string, sortBy: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        q: search,
        sort: sortBy
      });
      const response = await fetch(`/api/users/search?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentPage = parseInt(searchParams.get('page') || '1');
    fetchUsers(currentPage, debouncedSearch, sort);
  }, [debouncedSearch, searchParams, sort]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    if (debouncedSearch) {
      params.set('q', debouncedSearch);
    }
    router.push(`/users?${params.toString()}`);
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', value);
    params.set('page', '1');
    router.push(`/users?${params.toString()}`);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="p-6 bg-[#111] border-gray-800">
          <p className="text-gray-400 text-center">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Users</h1>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Suspense fallback={
            <div className="relative w-full sm:w-96">
              <div className="h-10 bg-[#111] border border-gray-800 rounded-md animate-pulse" />
            </div>
          }>
            <SearchComponent onSearch={setSearchQuery} />
          </Suspense>

          <div className="flex flex-wrap items-center gap-1 rounded-md border border-gray-800 bg-[#111] p-1">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSortChange(option.value)}
                className={`rounded px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                  sort === option.value
                    ? 'bg-[#222] text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="bg-[#111] border-gray-800 p-6">
              <div className="space-y-3">
                <div className="h-6 bg-gray-800 rounded animate-pulse w-24"></div>
                <div className="h-4 bg-gray-800 rounded animate-pulse w-32"></div>
                <div className="h-4 bg-gray-800 rounded animate-pulse w-20"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {users.map((user) => (
              <Card 
                key={user.username} 
                className="bg-[#111] border-gray-800 p-6 cursor-pointer hover:border-gray-600 transition-colors"
                onClick={() => router.push(`/users/${user.username}`)}
              >
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <UserAvatar username={user.username} hue={user.avatar_hue} size={44} />
                      {isOnline(user.last_seen) && (
                        <span
                          title="Online now"
                          className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#111] bg-green-500"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <h2 className="truncate text-xl font-semibold text-white">{user.username}</h2>
                        <StreakBadge days={user.streak} size="sm" />
                      </div>
                      <div
                        className="flex items-center gap-2 text-gray-400 text-sm"
                        title={formatDateTime(user.last_seen ?? user.last_login) ?? 'Never connected'}
                      >
                        <Clock className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {isOnline(user.last_seen)
                            ? 'Online now'
                            : timeAgo(user.last_seen ?? user.last_login)
                              ? `Last seen ${timeAgo(user.last_seen ?? user.last_login)}`
                              : 'Never connected'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 text-xs mt-1">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                        <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-gray-400 text-sm">
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      <span>{user.likes_given}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{user.comments_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                      </svg>
                      <span>{user.created_requests_count}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-red-900/20 text-red-400 border border-red-900/30' 
                        : 'bg-blue-900/20 text-blue-400 border border-blue-900/30'
                    }`}>
                      {user.role}
                    </span>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                      {user.team || 'No team'}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {((pagination.currentPage - 1) * pagination.usersPerPage) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.usersPerPage, pagination.totalUsers)} of{' '}
              {pagination.totalUsers} users
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-[#111] border-gray-800 text-gray-200 hover:bg-[#222]"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-[#111] border-gray-800 text-gray-200 hover:bg-[#222]"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// Main page component
export default function UsersPage() {
  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="container mx-auto px-4">
        <Suspense fallback={
          <div className="space-y-8">
            <div className="h-10 bg-[#111] border border-gray-800 rounded-md animate-pulse w-96" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-48 bg-[#111] border border-gray-800 rounded-md animate-pulse" />
              ))}
            </div>
          </div>
        }>
          <UsersContent />
        </Suspense>
      </div>
    </div>
  );
} 