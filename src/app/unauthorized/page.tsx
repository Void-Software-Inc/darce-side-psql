'use client';

import { Button } from "@/components/ui/button";
import { ShieldX, Home } from "lucide-react";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="text-center flex flex-col items-center px-4">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-red-950/30 border border-red-900/30">
            <ShieldX className="h-12 w-12 text-red-400" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-3">
          Access Denied
        </h1>
        
        <p className="text-gray-400 mb-8 max-w-md">
          You don't have permission to access this page. Please contact an administrator if you believe this is a mistake.
        </p>

        <Link href="/" className="inline-block">
          <Button
            variant="outline"
            className="bg-[#222222] hover:bg-[#2a2a2a] text-gray-200 border-[#2a2a2a] flex items-center gap-2 hover:text-white"
          >
            <Home className="h-4 w-4" />
            Return Home
          </Button>
        </Link>
      </div>
    </main>
  );
} 