'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import UsersOverview from './components/users-overview';
import VideosOverview from './components/videos-overview';
import CodesOverview from './components/codes-overview';
import RecommendationsOverview from './components/recommendations-overview';
import Link from 'next/link';
import { Video, UserPlus, Key } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateDialog, setGenerateDialog] = useState(false);

  const handleGenerateCode = async () => {
    try {
      setIsGenerating(true);
      const res = await fetch('/api/admin/codes/create', {
        method: 'POST'
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Access code generated successfully');
        // Trigger a refresh of the codes list
        document.dispatchEvent(new CustomEvent('refresh-codes'));
      } else {
        throw new Error(data.message || 'Failed to generate access code');
      }
    } catch (error) {
      console.error('Error generating code:', error);
      toast.error(error instanceof Error ? error.message : 'Error generating access code');
    } finally {
      setIsGenerating(false);
      setGenerateDialog(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        {/* Header with Create Buttons */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Manage users, videos, requests, and access codes</p>
          </div>

          {/* Create Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/admin/create-video" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full bg-[#222222] hover:bg-[#2a2a2a] text-gray-200 border-[#2a2a2a] flex items-center gap-2 hover:text-white"
              >
                <Video className="h-4 w-4" />
                <span className="hidden sm:inline">Create Video</span>
                <span className="sm:hidden">New Video</span>
              </Button>
            </Link>
            <Link href="/admin/create-user" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full bg-[#222222] hover:bg-[#2a2a2a] text-gray-200 border-[#2a2a2a] flex items-center gap-2 hover:text-white"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Create User</span>
                <span className="sm:hidden">New User</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full sm:w-auto bg-[#222222] hover:bg-[#2a2a2a] text-gray-200 border-[#2a2a2a] flex items-center gap-2 hover:text-white"
              onClick={() => setGenerateDialog(true)}
              disabled={isGenerating}
            >
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">Generate Code</span>
              <span className="sm:hidden">New Code</span>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="bg-[#222222] border border-[#2a2a2a]">
            <TabsTrigger 
              value="users"
              className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white"
            >
              Users
            </TabsTrigger>
            <TabsTrigger 
              value="videos"
              className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white"
            >
              Videos
            </TabsTrigger>
            <TabsTrigger 
              value="requests"
              className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white"
            >
              Requests
            </TabsTrigger>
            <TabsTrigger 
              value="codes"
              className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white"
            >
              Access Codes
            </TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-6">
            <UsersOverview />
          </TabsContent>
          <TabsContent value="videos" className="mt-6">
            <VideosOverview />
          </TabsContent>
          <TabsContent value="requests" className="mt-6">
            <RecommendationsOverview />
          </TabsContent>
          <TabsContent value="codes" className="mt-6">
            <CodesOverview />
          </TabsContent>
        </Tabs>
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
              onClick={handleGenerateCode}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto bg-transparent border-gray-800 text-gray-400 hover:bg-[#222222] hover:text-gray-200"
              onClick={() => setGenerateDialog(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 