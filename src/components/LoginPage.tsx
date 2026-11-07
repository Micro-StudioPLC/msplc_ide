import React, { useState } from 'react';
import { Leaf, Lock, Mail, User, ShieldCheck, UserPlus, ArrowRight, CheckCircle2, Sparkles, Sprout, FileJson, Eye, EyeOff } from 'lucide-react';
import { CaptchaWidget } from './CaptchaWidget';
import { AuthService } from '../services/authService';
import { User as UserType } from '../types/auth';

interface LoginPageProps {
  onLoginSuccess: (user: UserType) => void;
  onExploreGuest: () => void;
  onOpenUsersJsonViewer: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onExploreGuest,
  onOpenUsersJsonViewer
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('IoT & Eco-Automation Engineer');
  const [showPassword, setShowPassword] = useState(false);

  // Captcha State
  const [captchaInput, setCaptchaInput] = useState('');
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isCaptchaValid) {
      setErrorMessage('Please enter the security verification code correctly.');
      return;
    }

    setIsLoading(true);

    if (mode === 'register') {
      if (!name.trim()) {
        setErrorMessage('Please provide your full name.');
        setIsLoading(false);
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setErrorMessage('Please provide a valid email address.');
        setIsLoading(false);
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        setIsLoading(false);
        return;
      }

      // Add user and push to local data/users.json
      const result = await AuthService.register({
        name,
        email,
        password,
        role
      });

      setIsLoading(false);

      if (result.success && result.user) {
        setSuccessMessage(`User "${result.user.name}" created and pushed to data/users.json!`);
        setTimeout(() => {
          onLoginSuccess(result.user!);
        }, 800);
      } else {
        setErrorMessage(result.error || 'Failed to create user in users.json');
      }
    } else {
      // Login
      const result = await AuthService.login({
        email,
        password
      });

      setIsLoading(false);

      if (result.success && result.user) {
        setSuccessMessage(`Welcome back, ${result.user.name}!`);
        setTimeout(() => {
          onLoginSuccess(result.user!);
        }, 500);
      } else {
        setErrorMessage(result.error || 'Invalid credentials');
      }
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 sm:p-6 select-none bg-[#07130e] text-emerald-100 font-sans overflow-hidden">
      {/* Botanical Nature Visual Backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Soft Organic Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-700/20 blur-[130px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full bg-teal-800/15 blur-[150px]" />
        <div className="absolute top-[40%] right-[25%] w-[400px] h-[400px] rounded-full bg-lime-700/10 blur-[120px]" />

        {/* Delicate Botanical Leaf SVG Watermarks */}
        <svg className="absolute -bottom-16 -left-16 w-96 h-96 text-emerald-500/5 rotate-12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
        </svg>

        <svg className="absolute -top-20 -right-20 w-80 h-80 text-emerald-400/5 -rotate-45" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
        </svg>

        {/* Subtle grid mesh */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      {/* Main Nature-Themed Login Card */}
      <div className="relative z-10 w-full max-w-md bg-[#0c241a]/85 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        {/* Brand & Nature Icon Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.25)] mb-3">
            <Leaf className="w-7 h-7 text-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Web MCU Studio</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-600/40">
              GPL v3
            </span>
          </h1>
          <p className="text-xs text-emerald-400/80 mt-1 max-w-xs">
            Sustainable Embedded IDE &amp; PLC Automation Toolchain
          </p>
        </div>

        {/* Tab Controls: Sign In vs Add User */}
        <div className="flex rounded-xl bg-[#071610] p-1 border border-emerald-800/40 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-emerald-400/80 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              mode === 'register'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-emerald-400/80 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add User</span>
          </button>
        </div>

        {/* Notification alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2 animate-fadeIn">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-950/70 border border-emerald-600/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Full Name (Registration only) */}
          {mode === 'register' && (
            <div className="space-y-1.5 animate-fadeIn">
              <label className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Flora Greenwood"
                className="w-full bg-[#081b13] text-white text-xs px-3.5 py-2.5 rounded-lg border border-emerald-700/50 focus:border-emerald-400 focus:outline-none transition-all placeholder-emerald-700/60"
              />
            </div>
          )}

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. engineer@naturemcu.io"
              className="w-full bg-[#081b13] text-white text-xs px-3.5 py-2.5 rounded-lg border border-emerald-700/50 focus:border-emerald-400 focus:outline-none transition-all placeholder-emerald-700/60"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Password</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your security password"
                className="w-full bg-[#081b13] text-white text-xs px-3.5 py-2.5 rounded-lg border border-emerald-700/50 focus:border-emerald-400 focus:outline-none transition-all placeholder-emerald-700/60 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-emerald-500 hover:text-emerald-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Specialization / Role (Registration only) */}
          {mode === 'register' && (
            <div className="space-y-1.5 animate-fadeIn">
              <label className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                <span>Specialization / Role</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[#081b13] text-emerald-200 text-xs px-3 py-2 rounded-lg border border-emerald-700/50 focus:border-emerald-400 focus:outline-none cursor-pointer"
              >
                <option value="IoT & Eco-Automation Engineer">IoT &amp; Eco-Automation Engineer</option>
                <option value="PLC Systems Architect">PLC Systems Architect</option>
                <option value="Greenhouse & Hydroponics Controller">Greenhouse &amp; Hydroponics Controller</option>
                <option value="Home Gateway Developer">Home Gateway Developer</option>
                <option value="Embedded Robotics Engineer">Embedded Robotics Engineer</option>
              </select>
            </div>
          )}

          {/* Interactive Captcha Widget */}
          <div className="pt-1">
            <CaptchaWidget
              value={captchaInput}
              onChange={setCaptchaInput}
              onValidationChange={setIsCaptchaValid}
            />
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isLoading || !isCaptchaValid}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-xs text-white shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isLoading || !isCaptchaValid
                ? 'bg-emerald-900/60 text-emerald-400/60 cursor-not-allowed border border-emerald-800/40'
                : 'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] border border-emerald-400/30 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
            }`}
          >
            {mode === 'register' ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>{isLoading ? 'Saving to users.json...' : 'Create Account & Push to users.json'}</span>
              </>
            ) : (
              <>
                <span>{isLoading ? 'Authenticating...' : 'Sign In to Studio'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer actions: Guest / Demo mode & JSON File Inspector */}
        <div className="mt-6 pt-5 border-t border-emerald-800/40 flex flex-col gap-2.5 text-center text-xs">
          <div className="flex items-center justify-between text-[11px] text-emerald-400/80">
            <button
              onClick={onExploreGuest}
              className="text-emerald-300 hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
            >
              Continue as Demo Engineer →
            </button>

            <button
              onClick={onOpenUsersJsonViewer}
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-200 transition-colors cursor-pointer"
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Inspect users.json</span>
            </button>
          </div>

          <div className="text-[10px] text-emerald-600 mt-1">
            Persisted locally in <code className="font-mono text-emerald-400/80">data/users.json</code>
          </div>
        </div>
      </div>
    </div>
  );
};
