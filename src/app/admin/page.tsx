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

  useEffect(() => {
    async function fetchUsers() {
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
    }

    fetchUsers();
  }, []);

  const LoadingSkeleton = () => (
    <Table>
      <TableHeader>
        <TableRow className="border-gray-800">
          <TableHead className="text-gray-400 font-medium w-[200px]">Username</TableHead>
          <TableHead className="text-gray-400 font-medium w-[300px]">Email</TableHead>
          <TableHead className="text-gray-400 font-medium w-[100px]">Role</TableHead>
          <TableHead className="text-gray-400 font-medium w-[200px]">Joined</TableHead>
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
              <Link
                href="/admin/create-user"
                className="px-4 py-2 bg-[#222222] hover:bg-[#2a2a2a] text-gray-200 rounded-md transition-colors text-sm font-medium"
              >
                Create User
              </Link>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 