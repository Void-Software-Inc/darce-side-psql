'use client';

import { useState } from 'react';
import Image from "next/image";

export default function Home() {
  const [dbStatus, setDbStatus] = useState<{
    success?: boolean;
    message?: string;
    data?: any;
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const testDbConnection = async () => {
    try {
      setLoading(true);
      setDbStatus(null);
      
      const response = await fetch('/api/db-test');
      const data = await response.json();
      
      setDbStatus(data);
    } catch (error) {
      setDbStatus({
        success: false,
        message: 'Failed to test connection',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol className="list-inside list-decimal text-sm/6 text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2 tracking-[-.01em]">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
              src/app/page.tsx
            </code>
            .
          </li>
          <li className="tracking-[-.01em]">
            Save and see your changes instantly.
          </li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>

        <div className="mb-8">
          <button
            onClick={testDbConnection}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Testing Connection...' : 'Test Database Connection'}
          </button>
        </div>

        {dbStatus && (
          <div className={`p-4 rounded mb-4 ${dbStatus.success ? 'bg-green-100 border border-green-400' : 'bg-red-100 border border-red-400'}`}>
            <h2 className="text-xl font-semibold mb-2">
              {dbStatus.success ? 'Connection Successful' : 'Connection Failed'}
            </h2>
            <p className="mb-2">{dbStatus.message}</p>
            
            {dbStatus.data && (
              <div className="mt-4">
                <h3 className="font-medium">Database Response:</h3>
                <pre className="bg-gray-800 text-white p-3 rounded mt-2 overflow-x-auto">
                  {JSON.stringify(dbStatus.data, null, 2)}
                </pre>
              </div>
            )}
            
            {dbStatus.error && (
              <div className="mt-4">
                <h3 className="font-medium text-red-600">Error:</h3>
                <p className="text-red-600">{dbStatus.error}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 p-4 border rounded bg-gray-50">
          <h2 className="text-xl font-semibold mb-2">Connection Details</h2>
          <p className="mb-2">Host: 116.203.30.228</p>
          <p className="mb-2">Port: 5432</p>
          <p className="mb-2">Database: postgres</p>
          <p className="mb-2">User: postgres</p>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
