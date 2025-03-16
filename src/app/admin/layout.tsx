import { ReactNode } from 'react';
import AdminGuard from '../../components/AdminGuard';
import React from 'react';

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AdminGuard>{children}</AdminGuard>;
} 