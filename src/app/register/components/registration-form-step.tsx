import { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface RegistrationFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  team: string;
}

interface RegistrationFormStepProps {
  accessCode: string;
  onRegistered: () => void;
}

export default function RegistrationFormStep({ accessCode, onRegistered }: RegistrationFormStepProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<RegistrationFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    team: ''
  });

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
          team: formData.team,
          accessCode
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      onRegistered();
      toast.success('Registration successful');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    }
  };

  return (
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
          <Label htmlFor="team" className="text-white">Team</Label>
          <Input
            id="team"
            value={formData.team}
            onChange={(e) => setFormData(prev => ({ ...prev, team: e.target.value }))}
            placeholder="Enter your team name"
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
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleRegister}
          className="bg-black hover:bg-[#222222] text-white border border-[#2a2a2a]"
        >
          Create Account
        </Button>
      </div>
    </motion.div>
  );
} 