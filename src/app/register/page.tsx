'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [accessCode, setAccessCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const router = useRouter();

  const verifyCode = async () => {
    try {
      setIsVerifying(true);
      const response = await fetch('/api/admin/codes/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: accessCode }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Invalid code');
      }

      setStep(1);
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify code');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRegister = async () => {
    try {
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          accessCode
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      toast.success('Registration successful');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    }
  };

  const handleNext = async () => {
    if (step === 0) {
      if (!accessCode) {
        toast.error('Please enter an access code');
        return;
      }
      await verifyCode();
    } else {
      await handleRegister();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111111] p-4">
      <div className="w-full max-w-2xl bg-[#1a1a1a] rounded-lg shadow-xl p-8">
        <Steps numSteps={2} stepsComplete={step} />
        
        <div className="mt-8 mb-6">
          <AnimatePresence mode="wait">
            {step === 0 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <h2 className="text-xl font-semibold text-white mb-4">Enter Access Code</h2>
                <div className="space-y-2">
                  <Label htmlFor="accessCode" className="text-white">Access Code</Label>
                  <Input
                    id="accessCode"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="Enter your access code"
                    className="bg-[#222222] border-[#2a2a2a] text-white"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <h2 className="text-xl font-semibold text-white mb-4">Create Your Account</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-white">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Choose a username"
                      className="bg-[#222222] border-[#2a2a2a] text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                      className="bg-[#222222] border-[#2a2a2a] text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Create a password"
                      className="bg-[#222222] border-[#2a2a2a] text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm your password"
                      className="bg-[#222222] border-[#2a2a2a] text-white"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            className="bg-[#222222] hover:bg-[#2a2a2a] text-gray-200 border-[#2a2a2a]"
            onClick={() => router.push('/login')}
          >
            Back to Login
          </Button>
          <Button
            onClick={handleNext}
            disabled={isVerifying}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isVerifying ? 'Verifying...' : step === 0 ? 'Verify Code' : 'Create Account'}
          </Button>
        </div>
      </div>
    </div>
  );
}

const Steps = ({
  numSteps,
  stepsComplete,
}: {
  numSteps: number;
  stepsComplete: number;
}) => {
  const stepArray = Array.from(Array(numSteps).keys());

  return (
    <div className="flex items-center justify-between gap-3">
      {stepArray.map((num) => {
        const stepNum = num + 1;
        const isActive = stepNum <= stepsComplete + 1;
        return (
          <React.Fragment key={stepNum}>
            <Step num={stepNum} isActive={isActive} />
            {stepNum !== stepArray.length && (
              <div className="w-full h-1 rounded-full bg-[#2a2a2a] relative">
                <motion.div
                  className="absolute top-0 bottom-0 left-0 bg-indigo-600 rounded-full"
                  animate={{ width: isActive ? "100%" : 0 }}
                  transition={{ ease: "easeIn", duration: 0.3 }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const Step = ({ num, isActive }: { num: number; isActive: boolean }) => {
  return (
    <div className="relative">
      <div
        className={`w-10 h-10 flex items-center justify-center shrink-0 border-2 rounded-full font-semibold text-sm relative z-10 transition-colors duration-300 ${
          isActive
            ? "border-indigo-600 bg-indigo-600 text-white"
            : "border-[#2a2a2a] text-gray-500"
        }`}
      >
        <AnimatePresence mode="wait">
          {isActive ? (
            <motion.svg
              key="icon-marker-check"
              stroke="currentColor"
              fill="currentColor"
              strokeWidth="0"
              viewBox="0 0 16 16"
              height="1.6em"
              width="1.6em"
              xmlns="http://www.w3.org/2000/svg"
              initial={{ rotate: 180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -180, opacity: 0 }}
              transition={{ duration: 0.125 }}
            >
              <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"></path>
            </motion.svg>
          ) : (
            <motion.span
              key="icon-marker-num"
              initial={{ rotate: 180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -180, opacity: 0 }}
              transition={{ duration: 0.125 }}
            >
              {num}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      {isActive && (
        <div className="absolute z-0 -inset-1.5 bg-indigo-600/20 rounded-full animate-pulse" />
      )}
    </div>
  );
}; 