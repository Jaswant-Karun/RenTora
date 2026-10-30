import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Boxes,
  Cpu,
  Layers,
  ArrowRight,
  Database,
  Sparkles,
  Zap,
} from 'lucide-react';

export const IntroScreen: React.FC = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Initializing institutional resource registry...');
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const duration = 2800; // 2.8s smooth cinematic intro
    const interval = 28;
    const increment = 100 / (duration / interval);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setIsCompleted(true);
          return 100;
        }

        if (next < 25) {
          setStatusMessage('Initializing institutional resource registry...');
        } else if (next < 55) {
          setStatusMessage('Federating inter-departmental laboratory nodes...');
        } else if (next < 85) {
          setStatusMessage('Synchronizing safety clearance protocols & timeslots...');
        } else {
          setStatusMessage('Securing role-based institutional session...');
        }

        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, []);

  // When 100% is reached, smoothly transition to sign-in
  useEffect(() => {
    if (isCompleted) {
      const redirectTimer = setTimeout(() => {
        navigate('/login', { replace: true });
      }, 500);
      return () => clearTimeout(redirectTimer);
    }
  }, [isCompleted, navigate]);

  const handleSkip = () => {
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-slate-950 text-white selection:bg-brand-500 selection:text-white px-4">
      {/* Dynamic ambient radial gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-brand-600/20 via-indigo-600/15 to-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Skip Button Top Right */}
      <motion.button
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onClick={handleSkip}
        className="absolute top-6 right-6 z-20 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-xs font-medium text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer backdrop-blur-md"
      >
        <span>Skip intro</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </motion.button>

      {/* Main Animated Intro Card Container */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-xl flex flex-col items-center text-center"
        >
          {/* Animated Resource-Sharing Orbital Illustration */}
          <div className="relative w-44 h-44 mb-6 flex items-center justify-center">
            {/* Outer pulsating orbit ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
              className="absolute inset-0 rounded-full border border-dashed border-brand-500/30"
            />

            {/* Inner counter-rotating ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
              className="absolute inset-4 rounded-full border border-indigo-400/20"
            />

            {/* Floating orbiting resource nodes */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="absolute -top-3 w-8 h-8 rounded-xl bg-slate-900/90 border border-brand-500/40 text-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="absolute -bottom-3 w-8 h-8 rounded-xl bg-slate-900/90 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Layers className="w-4 h-4" />
              </div>
              <div className="absolute -left-3 w-8 h-8 rounded-xl bg-slate-900/90 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Database className="w-4 h-4" />
              </div>
              <div className="absolute -right-3 w-8 h-8 rounded-xl bg-slate-900/90 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
            </motion.div>

            {/* Center RENTORA Animated Emblem */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: [0.95, 1.05, 0.95], opacity: 1 }}
              transition={{
                scale: { repeat: Infinity, duration: 3, ease: 'easeInOut' },
                opacity: { duration: 0.6 },
              }}
              className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 p-0.5 shadow-2xl shadow-brand-500/30 flex items-center justify-center"
            >
              <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                <Boxes className="w-12 h-12 text-brand-400 drop-shadow-[0_0_12px_rgba(99,102,241,0.5)]" />
              </div>
            </motion.div>
          </div>

          {/* Platform Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="space-y-2 mb-3"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/25 text-brand-300 text-xs font-semibold uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5 text-brand-400" />
              Institutional Resource Federation
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-brand-300 bg-clip-text text-transparent">
              RENTORA
            </h1>
          </motion.div>

          {/* Mandatory Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="text-lg sm:text-xl font-semibold text-slate-200 tracking-wide mb-8 max-w-md"
          >
            “Access More. Own Less. Share Smarter.”
          </motion.p>

          {/* Professional Loading Progress Animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="w-full max-w-sm space-y-3 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-xl"
          >
            {/* Progress Header */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium truncate max-w-[240px]">
                {statusMessage}
              </span>
              <span className="font-mono font-bold text-brand-400">
                {Math.round(progress)}%
              </span>
            </div>

            {/* Glowing Progress Track */}
            <div className="w-full h-2 bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
              <motion.div
                className="h-full bg-gradient-to-r from-brand-500 via-indigo-500 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.6)]"
                style={{ width: `${progress}%` }}
                transition={{ ease: 'linear' }}
              />
            </div>

            {/* Subtext info */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Secure Session Protocol</span>
              <span>Encrypted JWT / Cookies</span>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default IntroScreen;
