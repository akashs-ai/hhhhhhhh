import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Transition easing curve for modern, responsive micro-interactions
export const premiumEase = [0.16, 1, 0.3, 1] as const;

// 1. Page Transition Component
export const PageTransition: React.FC<{
  children: React.ReactNode;
  className?: string;
  pageKey?: string;
}> = ({ children, className = '', pageKey }) => {
  return (
    <motion.div
      key={pageKey}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: premiumEase }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// 2. Staggered Container for Dashboard Metric Cards
export const StaggerContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}> = ({ children, className = '', staggerDelay = 0.04 }) => {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// 3. Staggered Card Item
export const CardTransition: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.22, ease: premiumEase },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// 4. Modal Dialog Entrance and Exit Wrapper
export const ModalWrapper: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ isOpen, onClose, children, maxWidth = 'max-w-lg' }) => {
  // Handle ESC key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: premiumEase }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.2, ease: premiumEase }}
            onClick={(e) => e.stopPropagation()}
            className={`relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full ${maxWidth} z-10 overflow-hidden`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// 5. Skeleton Loader for Loading States
export const Skeleton: React.FC<{
  className?: string;
}> = ({ className = 'h-4 w-full rounded-md' }) => {
  return <div className={`skeleton-shimmer ${className}`} />;
};
