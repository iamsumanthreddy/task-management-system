'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { apiFetch } from '@/lib/api';
import { PasswordRequirements, isPasswordValid } from '@/components/password-requirements';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordsMatch = newPassword === confirmPassword;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedOtp(data.otp);
        setStep('otp');
        toast.success('OTP generated! Check below.');
      } else {
        toast.error(data.message || 'Failed to generate OTP');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid(newPassword)) {
      toast.error('Password does not meet requirements');
      return;
    }
    if (!passwordsMatch) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep('done');
        toast.success('Password reset successful!');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        toast.error(data.message || 'Failed to reset password');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-lg font-semibold text-blue-600 text-center mb-1">Task Manager</h2>
        <h1 className="text-2xl font-bold text-center mb-6">Reset Password</h1>

        {step === 'email' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter your registered email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? 'Sending...' : 'Get OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <>
            {/* Show OTP for demo */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-center">
              <p className="text-sm text-green-700">Your OTP code:</p>
              <p className="text-2xl font-bold text-green-800 tracking-widest">{generatedOtp}</p>
              <p className="text-xs text-green-600 mt-1">Valid for 10 minutes</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest"
                  placeholder="000000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="showPwReset"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="showPwReset" className="text-xs text-gray-500 cursor-pointer select-none">
                    Show password
                  </label>
                </div>
                <PasswordRequirements password={newPassword} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    confirmPassword.length > 0
                      ? passwordsMatch
                        ? 'border-green-500'
                        : 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                {confirmPassword.length > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    {passwordsMatch ? (
                      <>
                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-xs text-green-600">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-xs text-red-600">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || !isPasswordValid(newPassword) || !passwordsMatch}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        {step === 'done' && (
          <div className="text-center py-4">
            <svg className="w-16 h-16 text-green-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-gray-700">Password reset successful!</p>
            <p className="text-sm text-gray-500 mt-1">Redirecting to login...</p>
          </div>
        )}

        <p className="text-center text-sm text-gray-600 mt-4">
          <Link href="/login" className="text-blue-600 hover:underline">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
