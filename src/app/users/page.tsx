'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, CalendarDays, Heart, MessageSquare } from 'lucide-react';
import { useDebounce } from '@/lib/hooks/use-debounce';

interface User {
  username: string;
  created_at: string;
  likes_given: number;
  comments_count: number;
  role: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  usersPerPage: number;
}

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    usersPerPage: 12
  });

  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchUsers = async (page: number, search: string) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        q: search
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
    const page = parseInt(searchParams.get('page') || '1');
    fetchUsers(page, debouncedSearch);

    // Update URL with search params
    const params = new URLSearchParams(searchParams);
    params.set('q', debouncedSearch);
    if (debouncedSearch === '') {
      params.delete('q');
    }
    router.push(`/users?${params.toString()}`);
  }, [debouncedSearch, searchParams.get('page')]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
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
    <div className="min-h-screen bg-black text-white py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">Users</h1>
          
          {/* Search Bar */}
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#111] border-gray-800 text-gray-200 w-full"
            />
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
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-1">{user.username}</h2>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <CalendarDays className="h-4 w-4" />
                        <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
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
                    </div>

                    <div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-red-900/20 text-red-400 border border-red-900/30' 
                          : 'bg-blue-900/20 text-blue-400 border border-blue-900/30'
                      }`}>
                        {user.role}
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
      </div>
    </div>
  );
} 