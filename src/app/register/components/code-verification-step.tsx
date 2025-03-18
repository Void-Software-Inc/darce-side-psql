import { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CodeVerificationStepProps {
  onVerified: () => void;
  onCodeChange: (code: string) => void;
  accessCode: string;
}

export default function CodeVerificationStep({ onVerified, onCodeChange, accessCode }: CodeVerificationStepProps) {
  const [isVerifying, setIsVerifying] = useState(false);

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

      onVerified();
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify code');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleNext = async () => {
    if (!accessCode) {
      toast.error('Please enter an access code');
      return;
    }
    await verifyCode();
  };

  return (
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
          onChange={(e) => onCodeChange(e.target.value)}
          placeholder="Enter your access code"
          className="bg-[#222222] border-[#2a2a2a] text-white"
        />
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleNext}
          disabled={isVerifying}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          {isVerifying ? 'Verifying...' : 'Verify Code'}
        </button>
      </div>
    </motion.div>
  );
} 