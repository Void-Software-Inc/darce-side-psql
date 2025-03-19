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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Trash2, Copy, Check } from 'lucide-react';

interface AccessCode {
  id: number;
  code: string;
  created_by: string;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
}

const CODES_PER_PAGE = 5;

export default function CodesOverview() {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generateDialog, setGenerateDialog] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const copyToClipboard = async (code: string, id: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      toast.success('Code copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

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

  // Initial fetch
  useEffect(() => {
    fetchCodes();
  }, []);

  // Listen for refresh event
  useEffect(() => {
    const handleRefresh = () => {
      fetchCodes();
    };

    document.addEventListener('refresh-codes', handleRefresh);
    return () => {
      document.removeEventListener('refresh-codes', handleRefresh);
    };
  }, []);

  useEffect(() => {
    const handleGenerateCode = () => {
      setGenerateDialog(true);
    };
    document.addEventListener('generate-code', handleGenerateCode);
    return () => {
      document.removeEventListener('generate-code', handleGenerateCode);
    };
  }, []);

  // Calculate pagination
  const totalPages = Math.ceil(codes.length / CODES_PER_PAGE);
  const paginatedCodes = codes.slice(
    (currentPage - 1) * CODES_PER_PAGE,
    currentPage * CODES_PER_PAGE
  );

  const LoadingSkeleton = () => (
    <div className="min-w-[640px]">
      <Table>
        <TableHeader>
          <TableRow className="border-[#2a2a2a]">
            <TableHead className="text-gray-400 font-medium">Code</TableHead>
            <TableHead className="text-gray-400 font-medium">Created By</TableHead>
            <TableHead className="text-gray-400 font-medium">Created At</TableHead>
            <TableHead className="text-gray-400 font-medium">Status</TableHead>
            <TableHead className="text-gray-400 font-medium">Used By</TableHead>
            <TableHead className="text-gray-400 font-medium">Used At</TableHead>
            <TableHead className="text-gray-400 font-medium w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, index) => (
            <TableRow key={index} className="border-[#2a2a2a]">
              <TableCell className="py-3">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-32"></div>
              </TableCell>
              <TableCell className="py-3">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-24"></div>
              </TableCell>
              <TableCell className="py-3">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-32"></div>
              </TableCell>
              <TableCell className="py-3">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-20"></div>
              </TableCell>
              <TableCell className="py-3">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-24"></div>
              </TableCell>
              <TableCell className="py-3">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-32"></div>
              </TableCell>
              <TableCell className="py-3">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-8"></div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (loading) {
    return (
      <div className="rounded-lg overflow-x-auto border border-[#2a2a2a]">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg overflow-x-auto border border-[#2a2a2a]">
        <div className="min-w-[640px]">
          <Table>
            <TableHeader>
              <TableRow className="border-[#2a2a2a] bg-[#222222]">
                <TableHead className="text-gray-400 font-medium">Code</TableHead>
                <TableHead className="text-gray-400 font-medium">Created By</TableHead>
                <TableHead className="text-gray-400 font-medium">Created At</TableHead>
                <TableHead className="text-gray-400 font-medium">Status</TableHead>
                <TableHead className="text-gray-400 font-medium">Used By</TableHead>
                <TableHead className="text-gray-400 font-medium">Used At</TableHead>
                <TableHead className="text-gray-400 font-medium w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCodes.map((code) => (
                <TableRow key={code.id} className="border-[#2a2a2a] hover:bg-[#222222] transition-colors">
                  <TableCell className="font-mono text-gray-200 py-3 flex items-center gap-2">
                    {code.code}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-white/10"
                      onClick={() => copyToClipboard(code.code, code.id)}
                    >
                      {copiedId === code.id ? (
                        <Check className="h-3 w-3 text-green-400" />
                      ) : (
                        <Copy className="h-3 w-3 text-gray-400" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="text-gray-200 py-3">{code.created_by}</TableCell>
                  <TableCell className="text-gray-200 py-3">{format(new Date(code.created_at), 'MMM d, yyyy HH:mm')}</TableCell>
                  <TableCell className="py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      code.is_used 
                        ? 'bg-red-900/20 text-red-400 border border-red-900/30'
                        : 'bg-green-900/20 text-green-400 border border-green-900/30'
                    }`}>
                      {code.is_used ? 'Used' : 'Available'}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-200 py-3">{code.used_by || '-'}</TableCell>
                  <TableCell className="text-gray-200 py-3">
                    {code.used_at 
                      ? format(new Date(code.used_at), 'MMM d, yyyy HH:mm')
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                      onClick={() => deleteCode(code.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {codes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-200 py-8">
                    No access codes found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {codes.length > 0 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-[#2a2a2a]">
              <div className="text-sm text-gray-400">
                Showing {((currentPage - 1) * CODES_PER_PAGE) + 1} to {Math.min(currentPage * CODES_PER_PAGE, codes.length)} of {codes.length} codes
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
          )}
        </div>
      </div>

      <Dialog 
        open={generateDialog} 
        onOpenChange={setGenerateDialog}
      >
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-gray-200 mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Generate Access Code</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to generate a new invite code? This code will be available for one-time use.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              className="w-full sm:w-auto bg-[#2a2a2a] hover:bg-[#333333] text-white"
              onClick={() => {
                generateCode();
                setGenerateDialog(false);
              }}
            >
              Generate
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto bg-transparent border-gray-800 text-gray-400 hover:bg-[#222222] hover:text-gray-200"
              onClick={() => setGenerateDialog(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 