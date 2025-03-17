'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
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
import Link from 'next/link';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    userId: number | null;
    username: string;
  }>({
    isOpen: false,
    userId: null,
    username: ''
  });

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
        // Refresh the users list
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
    <Table>
      <TableHeader>
        <TableRow className="border-gray-800">
          <TableHead className="text-gray-400 font-medium w-[200px]">Username</TableHead>
          <TableHead className="text-gray-400 font-medium w-[300px]">Email</TableHead>
          <TableHead className="text-gray-400 font-medium w-[100px]">Role</TableHead>
          <TableHead className="text-gray-400 font-medium w-[200px]">Joined</TableHead>
          <TableHead className="text-gray-400 font-medium w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(5)].map((_, index) => (
          <TableRow key={index} className="border-gray-800">
            <TableCell className="py-3">
              <div className="h-4 bg-gray-800 rounded animate-pulse w-32"></div>
            </TableCell>
            <TableCell className="py-3">
              <div className="h-4 bg-gray-800 rounded animate-pulse w-48"></div>
            </TableCell>
            <TableCell className="py-3">
              <div className="h-4 bg-gray-800 rounded animate-pulse w-16"></div>
            </TableCell>
            <TableCell className="py-3">
              <div className="h-4 bg-gray-800 rounded animate-pulse w-32"></div>
            </TableCell>
            <TableCell className="py-3">
              <div className="h-4 bg-gray-800 rounded animate-pulse w-16"></div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (error) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-full max-w-4xl px-4">
          <Card className="bg-[#1a1a1a] border border-[#2a2a2a] shadow-xl p-6">
            <p className="text-red-400">{error}</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-full max-w-6xl px-4">
        <Card className="bg-[#1a1a1a] border border-[#2a2a2a] shadow-xl">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Users Overview
                </h1>
                <p className="text-gray-400 text-sm mt-1">Manage and monitor user accounts</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/admin/create-video"
                  className="px-4 py-2 bg-[#222222] hover:bg-[#2a2a2a] text-gray-200 rounded-md transition-colors text-sm font-medium"
                >
                  Create Video
                </Link>
                <Link
                  href="/admin/create-user"
                  className="px-4 py-2 bg-[#222222] hover:bg-[#2a2a2a] text-gray-200 rounded-md transition-colors text-sm font-medium"
                >
                  Create User
                </Link>
              </div>
            </div>

            <div className="rounded-lg overflow-hidden border border-[#2a2a2a]">
              {loading ? (
                <LoadingSkeleton />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#2a2a2a] bg-[#222222]">
                      <TableHead className="text-gray-400 font-medium w-[200px]">Username</TableHead>
                      <TableHead className="text-gray-400 font-medium w-[300px]">Email</TableHead>
                      <TableHead className="text-gray-400 font-medium w-[100px]">Role</TableHead>
                      <TableHead className="text-gray-400 font-medium w-[200px]">Joined</TableHead>
                      <TableHead className="text-gray-400 font-medium w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="border-[#2a2a2a] hover:bg-[#222222] transition-colors">
                        <TableCell className="text-gray-200 py-3">{user.username}</TableCell>
                        <TableCell className="text-gray-200 py-3">{user.email}</TableCell>
                        <TableCell className="py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            user.role === 'admin' 
                              ? 'bg-red-900/20 text-red-400 border border-red-900/30' 
                              : 'bg-blue-900/20 text-blue-400 border border-blue-900/30'
                          }`}>
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-200 py-3">
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
              )}
            </div>
          </div>
        </Card>
      </div>

      <Dialog 
        open={deleteDialog.isOpen} 
        onOpenChange={(isOpen) => 
          setDeleteDialog(prev => ({ ...prev, isOpen }))
        }
      >
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-gray-200">
          <DialogHeader>
            <DialogTitle className="text-white">Delete User</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete {deleteDialog.username}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <div className="flex gap-3 w-full">
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
              >
                Delete
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 bg-transparent border-gray-800 text-gray-400 hover:bg-[#222222] hover:text-gray-200"
                onClick={() => setDeleteDialog({ isOpen: false, userId: null, username: '' })}
              >
                Cancel
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 