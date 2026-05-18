'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, Lock, User, Mail, Phone, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';

type Tab = 'signin' | 'signup';

const ROLES = [
  { value: 'DOCTOR',  label: 'Doctor',        desc: 'Clinical predictions & patient management' },
  { value: 'ANALYST', label: 'Data Analyst',   desc: 'Cohort analytics & model insights' },
  { value: 'PATIENT', label: 'Patient',        desc: 'View your own health records' },
];

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('signin');
  const { login, register } = useAuth();

  // ── Sign In state ──────────────────────────────────────────────────────────
  const [signInData, setSignInData] = useState({ username: '', password: '' });
  const [signInError, setSignInError]   = useState('');
  const [signInLoading, setSignInLoading] = useState(false);

  // ── Sign Up state ──────────────────────────────────────────────────────────
  const [signUpData, setSignUpData] = useState({
    username: '', email: '', first_name: '', last_name: '',
    phone: '', role: 'DOCTOR', password: '', password_confirm: '',
  });
  const [signUpError,   setSignUpError]   = useState('');
  const [signUpSuccess, setSignUpSuccess] = useState('');
  const [signUpLoading, setSignUpLoading] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError('');
    setSignInLoading(true);
    try {
      await login(signInData.username, signInData.password);
    } catch (err: any) {
      setSignInError(err.message || 'Invalid username or password');
    } finally {
      setSignInLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError('');
    setSignUpSuccess('');

    if (signUpData.password !== signUpData.password_confirm) {
      setSignUpError('Passwords do not match');
      return;
    }
    if (signUpData.password.length < 8) {
      setSignUpError('Password must be at least 8 characters');
      return;
    }

    setSignUpLoading(true);
    try {
      await register(signUpData);
      setSignUpSuccess('Account created! You are now signed in.');
    } catch (err: any) {
      // Django returns field-level errors as objects
      const data = err.data;
      if (data && typeof data === 'object') {
        const messages = Object.entries(data)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join(' | ');
        setSignUpError(messages);
      } else {
        setSignUpError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setSignUpLoading(false);
    }
  };

  // ── Shared input class ─────────────────────────────────────────────────────
  const input = 'w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition text-sm';
  const inputNoIcon = 'w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition text-sm';

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-xl mb-4">
            <Activity className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">MediSight</h1>
          <p className="text-gray-400 text-sm">AI-Powered Clinical Decision Support</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            {(['signin', 'signup'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-4 text-sm font-semibold transition ${
                  tab === t
                    ? 'text-white border-b-2 border-blue-500 bg-gray-800'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {t === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* ── SIGN IN ─────────────────────────────────────────────────── */}
          {tab === 'signin' && (
            <div className="p-8">
              {signInError && <ErrorBanner message={signInError} />}

              <form onSubmit={handleSignIn} className="space-y-5">
                <Field label="Username">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text" required autoComplete="username"
                      placeholder="Enter your username"
                      value={signInData.username}
                      onChange={e => setSignInData({ ...signInData, username: e.target.value })}
                      className={input}
                    />
                  </div>
                </Field>

                <Field label="Password">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password" required autoComplete="current-password"
                      placeholder="Enter your password"
                      value={signInData.password}
                      onChange={e => setSignInData({ ...signInData, password: e.target.value })}
                      className={input}
                    />
                  </div>
                </Field>

                <button
                  type="submit" disabled={signInLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {signInLoading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>

              {/* Demo credentials */}
              <div className="mt-6 p-4 bg-gray-800 border border-gray-700 rounded-xl">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Demo Credentials</p>
                <div className="space-y-1 text-xs">
                  <p className="text-gray-400">Admin: <span className="text-blue-400 font-mono">admin / admin123</span></p>
                  <p className="text-gray-400">Doctor: <span className="text-blue-400 font-mono">doctor1 / doctor123</span></p>
                  <p className="text-gray-400">Analyst: <span className="text-blue-400 font-mono">analyst1 / analyst123</span></p>
                </div>
              </div>
            </div>
          )}

          {/* ── SIGN UP ─────────────────────────────────────────────────── */}
          {tab === 'signup' && (
            <div className="p-8">
              {signUpError   && <ErrorBanner message={signUpError} />}
              {signUpSuccess && (
                <div className="mb-5 p-3 bg-green-900 bg-opacity-20 border border-green-700 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <p className="text-green-300 text-sm">{signUpSuccess}</p>
                </div>
              )}

              <form onSubmit={handleSignUp} className="space-y-4">
                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First Name">
                    <input
                      type="text" required placeholder="First"
                      value={signUpData.first_name}
                      onChange={e => setSignUpData({ ...signUpData, first_name: e.target.value })}
                      className={inputNoIcon}
                    />
                  </Field>
                  <Field label="Last Name">
                    <input
                      type="text" required placeholder="Last"
                      value={signUpData.last_name}
                      onChange={e => setSignUpData({ ...signUpData, last_name: e.target.value })}
                      className={inputNoIcon}
                    />
                  </Field>
                </div>

                <Field label="Username">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text" required placeholder="Choose a username"
                      autoComplete="username"
                      value={signUpData.username}
                      onChange={e => setSignUpData({ ...signUpData, username: e.target.value })}
                      className={input}
                    />
                  </div>
                </Field>

                <Field label="Email">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email" required placeholder="your@email.com"
                      value={signUpData.email}
                      onChange={e => setSignUpData({ ...signUpData, email: e.target.value })}
                      className={input}
                    />
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Phone (optional)">
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel" placeholder="+91 ..."
                        value={signUpData.phone}
                        onChange={e => setSignUpData({ ...signUpData, phone: e.target.value })}
                        className={input}
                      />
                    </div>
                  </Field>

                  <Field label="Role">
                    <div className="relative">
                      <select
                        value={signUpData.role}
                        onChange={e => setSignUpData({ ...signUpData, role: e.target.value })}
                        className={`${inputNoIcon} appearance-none pr-8`}
                      >
                        {ROLES.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </Field>
                </div>

                {/* Role description hint */}
                <p className="text-xs text-gray-500 -mt-2">
                  {ROLES.find(r => r.value === signUpData.role)?.desc}
                </p>

                <Field label="Password">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password" required placeholder="Min. 8 characters"
                      autoComplete="new-password"
                      value={signUpData.password}
                      onChange={e => setSignUpData({ ...signUpData, password: e.target.value })}
                      className={input}
                    />
                  </div>
                </Field>

                <Field label="Confirm Password">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password" required placeholder="Re-enter password"
                      autoComplete="new-password"
                      value={signUpData.password_confirm}
                      onChange={e => setSignUpData({ ...signUpData, password_confirm: e.target.value })}
                      className={`${input} ${
                        signUpData.password_confirm && signUpData.password !== signUpData.password_confirm
                          ? 'border-red-500'
                          : signUpData.password_confirm && signUpData.password === signUpData.password_confirm
                          ? 'border-green-500'
                          : ''
                      }`}
                    />
                  </div>
                </Field>

                <button
                  type="submit" disabled={signUpLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {signUpLoading ? 'Creating account…' : 'Create Account'}
                </button>
              </form>

              <p className="text-xs text-gray-500 text-center mt-4">
                Admin approval may be required depending on your organisation's settings.
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          © 2025 MediSight · AI-Powered Healthcare Analytics
        </p>
      </div>
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-300 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-5 p-3 bg-red-900 bg-opacity-20 border border-red-700 rounded-lg flex items-start gap-2">
      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
      <p className="text-red-300 text-sm">{message}</p>
    </div>
  );
}