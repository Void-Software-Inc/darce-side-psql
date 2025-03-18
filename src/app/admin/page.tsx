'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsersOverview from './components/users-overview';
import VideosOverview from './components/videos-overview';
import CodesOverview from './components/codes-overview';
import Link from 'next/link';
import { Video, UserPlus, Key } from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users');

  const handleGenerateCode = () => {
    document.dispatchEvent(new CustomEvent('generate-code'));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        {/* Header with Create Buttons */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Manage users, videos, and access codes</p>
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
              onClick={handleGenerateCode}
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
          <TabsContent value="codes" className="mt-6">
            <CodesOverview />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 