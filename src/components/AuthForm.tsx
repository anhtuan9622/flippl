import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import Features from './Features';

interface AuthFormProps {
  onSuccess: () => void;
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success('Password reset instructions sent to your email');
        setIsForgotPassword(false);
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success('Account created successfully! Please log in.');
        setIsSignUp(false);
      } else {
        const { error: signInError, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password');
          }
          throw signInError;
        }

        if (!data.session) {
          throw new Error('Failed to create session');
        }

        onSuccess();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp);
    setIsForgotPassword(false);
  };

  const handleForgotPassword = () => {
    setIsForgotPassword(true);
    setIsSignUp(false);
  };

  return (
    <div className="min-h-screen bg-yellow-50 px-4 py-8 md:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Header />
        
        <div className="grid gap-8">
          <Features
            title="⚡ Track Your Trades. No Fluff. Just P/L."
            description="Flippl helps you log, analyze, and make sense of your trading performance with clean insights—no distractions, no BS."
          />

          <div className="neo-brutalist-white p-8">
            <div className="max-w-md mx-auto">
              <h2 className="text-3xl font-black text-black mb-2 text-center">
                {isForgotPassword 
                  ? '🔑 Reset Password'
                  : isSignUp 
                    ? '🚀 Join for Free' 
                    : '👋 Welcome Back'}
              </h2>
              <p className="text-gray-600 mb-8 text-center">
                {isForgotPassword
                  ? "Enter your email and we'll send you instructions to reset your password."
                  : isSignUp 
                    ? "Start tracking your trading journey with Flippl. Because guessing isn't a strategy."
                    : 'Log in to track your trades, analyze your P/L, and stay ahead.'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-black text-black mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="neo-input w-full pl-10"
                      placeholder="anh@hoang.com"
                      required
                      minLength={5}
                      maxLength={50}
                    />
                  </div>
                </div>

                {!isForgotPassword && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-black text-black mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="neo-input w-full pl-10 pr-10"
                        placeholder="******"
                        required
                        minLength={6}
                        maxLength={50}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="neo-brutalist-blue w-full py-3 font-bold disabled:opacity-50"
                >
                  {loading 
                    ? 'Loading...' 
                    : isForgotPassword
                      ? 'Send reset instructions'
                      : isSignUp 
                        ? 'Sign Up' 
                        : 'Log In'}
                </button>
              </form>

              <div className="mt-6 space-y-4 text-center">
                {!isForgotPassword && !isSignUp && (
                  <button
                    onClick={handleForgotPassword}
                    className="text-sm font-bold text-blue-600 hover:text-blue-800"
                  >
                    Forgot password?
                  </button>
                )}

                <button
                  onClick={handleToggleMode}
                  className="text-sm font-bold text-blue-600 hover:text-blue-800 block w-full"
                >
                  {isForgotPassword
                    ? 'Back to Log In'
                    : isSignUp 
                      ? 'Already have an account? Log in' 
                      : "New to Flippl? Sign up for free"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}