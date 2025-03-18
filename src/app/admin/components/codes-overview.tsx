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

export default function CodesOverview() {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generateDialog, setGenerateDialog] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

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

  useEffect(() => {
    fetchCodes();
  }, []);

  // Listen for generate-code event from parent
  useEffect(() => {
    const handleGenerateCode = () => {
      setGenerateDialog(true);
    };
    document.addEventListener('generate-code', handleGenerateCode);
    return () => {
      document.removeEventListener('generate-code', handleGenerateCode);
    };
  }, []);

  if (loading) {
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
            {[...Array(5)].map((_, index) => (
              <TableRow key={index} className="border-b border-[#2a2a2a] hover:bg-[#2a2a2a]">
                <TableCell>
                  <div className="h-4 bg-gray-800 rounded animate-pulse w-32"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-800 rounded animate-pulse w-24"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-800 rounded animate-pulse w-32"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-800 rounded animate-pulse w-20"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-800 rounded animate-pulse w-24"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-800 rounded animate-pulse w-32"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-800 rounded animate-pulse w-8"></div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <>
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
                <TableCell className="font-mono text-white flex items-center gap-2">
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
                    className="hover:bg-red-900/30 hover:text-red-400 text-white"
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
              className="w-full sm:w-auto bg-black hover:bg-[#222222] text-white border border-[#2a2a2a]"
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