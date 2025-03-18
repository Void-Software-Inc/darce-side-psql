'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import CodeVerificationStep from './components/code-verification-step';
import RegistrationFormStep from './components/registration-form-step';
import React from 'react';

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [accessCode, setAccessCode] = useState('');
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const router = useRouter();

  const handleStepComplete = (stepNumber: number) => {
    setCompletedSteps(prev => [...prev, stepNumber]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111111] p-4">
      <div className="w-full max-w-md bg-[#1a1a1a] rounded-lg shadow-xl p-6">
        <Steps numSteps={2} currentStep={step} completedSteps={completedSteps} />
        
        <div className="mt-6">
          <AnimatePresence mode="wait">
            {step === 0 ? (
              <CodeVerificationStep
                accessCode={accessCode}
                onCodeChange={setAccessCode}
                onVerified={() => {
                  handleStepComplete(0);
                  setStep(1);
                }}
                onBack={() => router.push('/login')}
              />
            ) : (
              <RegistrationFormStep 
                accessCode={accessCode} 
                onRegistered={() => handleStepComplete(1)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

const Steps = ({
  numSteps,
  currentStep,
  completedSteps,
}: {
  numSteps: number;
  currentStep: number;
  completedSteps: number[];
}) => {
  const stepArray = Array.from(Array(numSteps).keys());

  return (
    <div className="flex items-center justify-between gap-3">
      {stepArray.map((num) => {
        const stepNum = num + 1;
        const isCompleted = completedSteps.includes(num);
        const isActive = num === currentStep || isCompleted;
        return (
          <React.Fragment key={stepNum}>
            <Step num={stepNum} isActive={isActive} isCompleted={isCompleted} />
            {stepNum !== stepArray.length && (
              <div className="w-full h-1 rounded-full bg-[#2a2a2a] relative">
                <motion.div
                  className="absolute top-0 bottom-0 left-0 bg-black rounded-full"
                  animate={{ width: isCompleted ? "100%" : 0 }}
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

const Step = ({ num, isActive, isCompleted }: { num: number; isActive: boolean; isCompleted: boolean }) => {
  return (
    <div className="relative">
      <div
        className={`w-10 h-10 flex items-center justify-center shrink-0 border-2 rounded-full font-semibold text-sm relative z-10 transition-colors duration-300 ${
          isActive
            ? "border-black bg-black text-white"
            : "border-[#2a2a2a] text-gray-500"
        }`}
      >
        <AnimatePresence mode="wait">
          {isCompleted ? (
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
      {isActive && !isCompleted && (
        <div className="absolute z-0 -inset-1.5 bg-black/20 rounded-full animate-pulse" />
      )}
    </div>
  );
}; 