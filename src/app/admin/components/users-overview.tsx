'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search } from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

const USERS_PER_PAGE = 5;

export default function UsersOverview() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    userId: number | null;
    username: string;
  }>({
    isOpen: false,
    userId: null,
    username: ''
  });

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE
  );

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users/get');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      } else {
        setError('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async () => {
    if (!deleteDialog.userId) return;

    try {
      const res = await fetch(`/api/admin/users/delete?userId=${deleteDialog.userId}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (res.ok) {
        fetchUsers();
      } else {
        setError(data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Error deleting user');
    } finally {
      setDeleteDialog({ isOpen: false, userId: null, username: '' });
    }
  };

  const LoadingSkeleton = () => (
    <div className="min-w-[640px]">
      <Table>
        <TableHeader>
          <TableRow className="border-gray-800">
            <TableHead className="text-gray-400 font-medium">Username</TableHead>
            <TableHead className="text-gray-400 font-medium hidden md:table-cell">Email</TableHead>
            <TableHead className="text-gray-400 font-medium">Role</TableHead>
            <TableHead className="text-gray-400 font-medium hidden sm:table-cell">Joined</TableHead>
            <TableHead className="text-gray-400 font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, index) => (
            <TableRow key={index} className="border-gray-800">
              <TableCell className="py-3">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-32"></div>
              </TableCell>
              <TableCell className="py-3 hidden md:table-cell">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-48"></div>
              </TableCell>
              <TableCell className="py-3">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-16"></div>
              </TableCell>
              <TableCell className="py-3 hidden sm:table-cell">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-32"></div>
              </TableCell>
              <TableCell className="py-3">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-16"></div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search by username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#222222] border-[#2a2a2a] text-gray-200 w-full sm:w-64"
          />
        </div>
      </div>

      <div className="rounded-lg overflow-x-auto border border-[#2a2a2a]">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="min-w-[640px]">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2a2a2a] bg-[#222222]">
                  <TableHead className="text-gray-400 font-medium">Username</TableHead>
                  <TableHead className="text-gray-400 font-medium hidden md:table-cell">Email</TableHead>
                  <TableHead className="text-gray-400 font-medium">Role</TableHead>
                  <TableHead className="text-gray-400 font-medium hidden sm:table-cell">Joined</TableHead>
                  <TableHead className="text-gray-400 font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow key={user.id} className="border-[#2a2a2a] hover:bg-[#222222] transition-colors">
                    <TableCell className="text-gray-200 py-3">
                      <div>
                        <div>{user.username}</div>
                        <div className="text-gray-400 text-sm md:hidden">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-200 py-3 hidden md:table-cell">{user.email}</TableCell>
                    <TableCell className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-red-900/20 text-red-400 border border-red-900/30' 
                          : 'bg-blue-900/20 text-blue-400 border border-blue-900/30'
                      }`}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-200 py-3 hidden sm:table-cell">
                      {new Date(user.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                        onClick={() => setDeleteDialog({
                          isOpen: true,
                          userId: user.id,
                          username: user.username
                        })}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-4 border-t border-[#2a2a2a]">
              <div className="text-sm text-gray-400">
                Showing {((currentPage - 1) * USERS_PER_PAGE) + 1} to {Math.min(currentPage * USERS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[#222222] border-[#2a2a2a] text-gray-200 hover:bg-[#2a2a2a]"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[#222222] border-[#2a2a2a] text-gray-200 hover:bg-[#2a2a2a]"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog 
        open={deleteDialog.isOpen} 
        onOpenChange={(isOpen) => 
          setDeleteDialog(prev => ({ ...prev, isOpen }))
        }
      >
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-gray-200 mx-4">
          <DialogHeader>
            <DialogTitle className="text-white">Delete User</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete {deleteDialog.username}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={handleDelete}
            >
              Delete
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto bg-transparent border-gray-800 text-gray-400 hover:bg-[#222222] hover:text-gray-200"
              onClick={() => setDeleteDialog({ isOpen: false, userId: null, username: '' })}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 