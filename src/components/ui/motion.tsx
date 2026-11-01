import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Highly optimized easing curve for modern, responsive micro-interactions (snappy, no overshoot)
export const premiumEase = [0.16, 1, 0.3, 1] as const;

// 1. Lightweight Page Transition Component (Hardware-accelerated blend in/out)
export const PageTransition: React.FC<{
  children: React.ReactNode;
  className?: string;
  pageKey?: string;
}> = ({ children, className = '', pageKey }) => {
  return (
    <div
      key={pageKey}
      className={`cit-page-blend ${className}`}
    >
      {children}
    </div>
  );
};

// 2. Coordinated Container for Dashboard Metric Cards (Hardware-staggered entry delay)
export const StaggerContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}> = ({ children, className = '' }) => {
  return (
    <div className={`cit-stagger-boxes ${className}`}>
      {children}
    </div>
  );
};

// 3. Silky Box / Card Blend-In Component (Zero JS overhead, smooth GPU blend, no jitter)
export const CardTransition: React.FC<{
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}> = ({ children, className = '', delayMs }) => {
  const inlineStyle = delayMs !== undefined ? { animationDelay: `${delayMs}ms` } : undefined;
  return (
    <div
      className={`cit-box-blend ${className}`}
      style={inlineStyle}
    >
      {children}
    </div>
  );
};

// 4. Modal Dialog Entrance and Exit Wrapper (Snappy 150ms entrance)
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
            transition={{ duration: 0.14, ease: premiumEase }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 4 }}
            transition={{ duration: 0.16, ease: premiumEase }}
            onClick={(e) => e.stopPropagation()}
            style={{ willChange: 'opacity, transform' }}
            className={`relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full ${maxWidth} z-10 overflow-hidden`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// 5. Skeleton Loader with Stable Dimensions
export const Skeleton: React.FC<{
  className?: string;
}> = ({ className = 'h-4 w-full rounded-md' }) => {
  return <div className={`skeleton-shimmer ${className}`} />;
};
