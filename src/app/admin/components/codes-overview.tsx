'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';

interface AccessCode {
  id: number;
  code: string;
  created_by: string;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
}

export default function CodesOverview() {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCodes = async () => {
    try {
      const response = await fetch('/api/admin/codes/get');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }
      
      setCodes(data.codes);
    } catch (error) {
      toast.error('Failed to load access codes');
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async () => {
    try {
      const response = await fetch('/api/admin/codes/create', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }
      
      setCodes(prev => [data.code, ...prev]);
      toast.success('New access code generated');
    } catch (error) {
      toast.error('Failed to generate access code');
    }
  };

  const deleteCode = async (id: number) => {
    try {
      const response = await fetch('/api/admin/codes/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }
      
      setCodes(prev => prev.filter(code => code.id !== id));
      toast.success('Access code deleted');
    } catch (error) {
      toast.error('Failed to delete access code');
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  // Listen for generate-code event from parent
  useEffect(() => {
    const handleGenerateCode = () => {
      generateCode();
    };
    document.addEventListener('generate-code', handleGenerateCode);
    return () => {
      document.removeEventListener('generate-code', handleGenerateCode);
    };
  }, []);

  if (loading) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-[#2a2a2a]">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-[#2a2a2a] hover:bg-transparent">
            <TableHead className="text-gray-400">Code</TableHead>
            <TableHead className="text-gray-400">Created By</TableHead>
            <TableHead className="text-gray-400">Created At</TableHead>
            <TableHead className="text-gray-400">Status</TableHead>
            <TableHead className="text-gray-400">Used By</TableHead>
            <TableHead className="text-gray-400">Used At</TableHead>
            <TableHead className="text-gray-400 w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {codes.map((code) => (
            <TableRow key={code.id} className="border-b border-[#2a2a2a] hover:bg-[#2a2a2a]">
              <TableCell className="font-mono text-white">{code.code}</TableCell>
              <TableCell className="text-white">{code.created_by}</TableCell>
              <TableCell className="text-white">{format(new Date(code.created_at), 'MMM d, yyyy HH:mm')}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  code.is_used 
                    ? 'bg-red-900/30 text-red-400'
                    : 'bg-green-900/30 text-green-400'
                }`}>
                  {code.is_used ? 'Used' : 'Available'}
                </span>
              </TableCell>
              <TableCell className="text-white">{code.used_by || '-'}</TableCell>
              <TableCell className="text-white">
                {code.used_at 
                  ? format(new Date(code.used_at), 'MMM d, yyyy HH:mm')
                  : '-'
                }
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-red-900/30 hover:text-red-400"
                  onClick={() => deleteCode(code.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {codes.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-white py-8">
                No access codes found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
} 