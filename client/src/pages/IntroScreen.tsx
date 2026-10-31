import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layers, ArrowRight, ShieldCheck } from 'lucide-react';

export const IntroScreen: React.FC = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Initializing institutional resource registry...');
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const duration = 2200; // 2.2s clean, fast enterprise intro
    const interval = 25;
    const increment = 100 / (duration / interval);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setIsCompleted(true);
          return 100;
        }

        if (next < 30) {
          setStatusMessage('Initializing institutional resource registry...');
        } else if (next < 65) {
          setStatusMessage('Federating laboratory equipment nodes...');
        } else if (next < 90) {
          setStatusMessage('Synchronizing safety clearance protocols...');
        } else {
          setStatusMessage('Securing institutional session...');
        }

        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isCompleted) {
      const redirectTimer = setTimeout(() => {
        navigate('/login', { replace: true });
      }, 400);
      return () => clearTimeout(redirectTimer);
    }
  }, [isCompleted, navigate]);

  const handleSkip = () => {
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F8FAFC] text-[#172033] px-4 selection:bg-[#1769D2] selection:text-white">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-sm text-center space-y-6"
      >
        {/* Logo & Icon */}
        <div className="flex flex-col items-center space-y-3">
          <div className="w-14 h-14 rounded-xl bg-[#1769D2] text-white flex items-center justify-center shadow-md shadow-blue-500/15">
            <Layers className="w-7 h-7" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#172033]">RENTORA</h1>
            <p className="text-xs text-[#1769D2] font-semibold tracking-wide uppercase mt-0.5">
              Smart Institutional Resource Sharing
            </p>
          </div>
        </div>

        {/* Tagline */}
        <div className="py-2">
          <p className="text-sm font-medium text-[#172033] tracking-tight">
            "Access More. Own Less. Share Smarter."
          </p>
          <p className="text-xs text-[#64748B] mt-1">
            Enterprise campus equipment federation & reservation platform
          </p>
        </div>

        {/* Progress Animation */}
        <div className="space-y-2">
          <div className="w-full h-1.5 bg-[#EFF6FF] rounded-full overflow-hidden border border-blue-100">
            <motion.div
              className="h-full bg-[#1769D2] rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#64748B]">
            <span className="truncate pr-2">{statusMessage}</span>
            <span className="font-semibold text-[#172033]">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Team Credits & Skip */}
        <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
          <div className="text-left">
            <span className="font-medium text-[#172033] block">Team Storm Breakerz</span>
            <span className="text-[10px]">Leader: Jaswant Karun S A</span>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#1769D2] hover:text-[#1256B0] transition-colors"
          >
            <span>Skip</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default IntroScreen;
