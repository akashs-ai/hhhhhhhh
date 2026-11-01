/**
 * LoginPanel Component
 * Reusable, configurable login interface designed to complement the campus aesthetic.
 * Positioned cleanly to avoid obscuring the student or campus gates.
 */

import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export interface LoginPanelProps {
  instituteLogo?: React.ReactNode;
  instituteName?: string;
  welcomeHeading?: string;
  onLoginSubmit?: (credentials: { identifier: string; pass: string }) => void;
  onForgotPassword?: () => void;
  onSwitchToAdvanced?: () => void;
  className?: string;
}

export const LoginPanel: React.FC<LoginPanelProps> = ({
  instituteLogo,
  instituteName = 'Chilika Institute of Technology',
  welcomeHeading = 'Welcome Back to Campus',
  onLoginSubmit,
  onForgotPassword,
  onSwitchToAdvanced,
  className = '',
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;
    setIsSubmitting(true);
    if (onLoginSubmit) {
      onLoginSubmit({ identifier, pass: password });
    }
  };

  return (
    <div
      className={`w-full max-w-sm bg-[#18241d]/90 backdrop-blur-xl border border-[#3b5445]/60 rounded-3xl p-6 sm:p-7 shadow-2xl text-[#f5ebd9] ${className}`}
    >
      {/* Header */}
      <div className="flex items-center space-x-3 mb-5">
        {instituteLogo || (
          <div className="w-10 h-10 rounded-2xl bg-[#2a3e33] border border-[#486b58] text-[#d8b568] flex items-center justify-center font-serif font-black text-lg shadow-sm">
            C
          </div>
        )}
        <div>
          <h3 className="text-xs font-serif tracking-wider uppercase text-[#a7bba9]">
            {instituteName}
          </h3>
          <h2 className="text-base font-serif font-bold text-[#faf3e7]">
            {welcomeHeading}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Email or Username */}
        <div>
          <label className="block text-[11px] font-sans font-semibold text-[#c8d4cc] mb-1">
            Email or Student ID
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="name@cit.ac.in or Google account"
              className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl bg-[#213127]/80 border border-[#374e40] text-[#faf3e7] placeholder-[#6f8777] focus:outline-none focus:border-[#d8b568] focus:ring-1 focus:ring-[#d8b568]/40 transition-all"
            />
            <Mail className="w-3.5 h-3.5 text-[#738e7c] absolute left-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-sans font-semibold text-[#c8d4cc]">
              Passphrase
            </label>
            {onForgotPassword && (
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-[10px] text-[#d8b568] hover:underline cursor-pointer"
              >
                Forgot?
              </button>
            )}
          </div>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl bg-[#213127]/80 border border-[#374e40] text-[#faf3e7] placeholder-[#6f8777] focus:outline-none focus:border-[#d8b568] focus:ring-1 focus:ring-[#d8b568]/40 transition-all"
            />
            <Lock className="w-3.5 h-3.5 text-[#738e7c] absolute left-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#2f4639] via-[#3a5847] to-[#2f4639] hover:from-[#375243] hover:to-[#375243] border border-[#5a816b] text-[#f7f0e3] font-serif font-bold text-xs tracking-wide shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <span>Authenticate Session</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#d8b568]" />
        </button>

        {/* Alternative Role Login Switcher */}
        {onSwitchToAdvanced && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onSwitchToAdvanced}
              className="text-[11px] text-[#a9bcae] hover:text-[#f4edd9] transition-colors cursor-pointer inline-flex items-center space-x-1"
            >
              <ShieldCheck className="w-3 h-3 text-[#d8b568]" />
              <span>Full Role-Based Portal (Student, Faculty, Admin)</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
