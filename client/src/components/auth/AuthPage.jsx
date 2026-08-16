import React, { useState } from 'react';
import { MessageSquare, Shield, Zap, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { Input } from '../ui/Input.jsx';
import { Button } from '../ui/Button.jsx';

export function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loginField, setLoginField] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');

  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'login') {
      await login(loginField, password);
    } else {
      await register({
        username,
        displayName: displayName || username,
        email,
        password,
      });
    }
  };

  return (
    <div className="min-h-screen bg-chat-bg flex flex-col items-center justify-center p-4 selection:bg-brand-500 selection:text-white">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-500 shadow-xl shadow-brand-500/25 text-white mb-2">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Nexus Platform</h1>
          <p className="text-xs text-chat-muted">
            High-performance real-time messaging and community ecosystem
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-chat-sidebar border border-chat-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Tab Switcher */}
          <div className="flex bg-chat-panel p-1 rounded-2xl border border-chat-border/80">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-chat-muted hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'register'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-chat-muted hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <Input
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. dennis_dev"
                  required
                />
                <Input
                  label="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Dennis Kiplagat"
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dennis@nexus.dev"
                  required
                />
              </>
            )}

            {mode === 'login' && (
              <Input
                label="Email or Username"
                value={loginField}
                onChange={(e) => setLoginField(e.target.value)}
                placeholder="Enter your email or username"
                required
              />
            )}

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full py-3 text-sm font-bold shadow-lg shadow-brand-500/20"
            >
              {mode === 'login' ? 'Sign In to Nexus' : 'Create Account'}
            </Button>
          </form>

          {/* Feature Highlights */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-chat-border/50 text-[10px] text-chat-muted text-center">
            <div className="flex flex-col items-center gap-1">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Real-Time</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Encrypted</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span>Presence</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
