'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsersOverview from './components/users-overview';
import VideosOverview from './components/videos-overview';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage users and videos</p>
        </div>

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
          </TabsList>
          <TabsContent value="users" className="mt-6">
            <UsersOverview />
          </TabsContent>
          <TabsContent value="videos" className="mt-6">
            <VideosOverview />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 