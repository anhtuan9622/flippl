import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Lock, Mail } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
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
  };

  return (
    <div className="min-h-screen bg-yellow-50 px-4 py-8 md:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Header />
        
        <div className="grid gap-8">
          {/* Features Section */}
          <Features
            title="⚡ Track Your Trades. No Fluff. Just P/L."
            description="Flippl helps you log, analyze, and make sense of your trading performance with clean insights—no distractions, no BS."
          />

          {/* Auth Form Section */}
          <div className="neo-brutalist-white p-8">
            <div className="max-w-md mx-auto">
              <h2 className="text-3xl font-black text-black mb-2 text-center">
                {isSignUp ? '🚀 Join for Free' : '👋 Welcome Back'}
              </h2>
              <p className="text-gray-600 mb-8 text-center">
                {isSignUp 
                  ? 'Start tracking your trading journey with Flippl. Because guessing isn’t a strategy.'
                  : 'Log in to track your trades, analyze your P/L, and stay ahead.'
                }
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
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-black text-black mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="neo-input w-full pl-10"
                      placeholder="Enter your password"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="neo-brutalist-blue w-full py-3 font-bold disabled:opacity-50"
                >
                  {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Log In'}
                </button>
              </form>

              <button
                onClick={handleToggleMode}
                className="mt-6 text-sm font-bold text-blue-600 hover:text-blue-800 w-full text-center"
              >
                {isSignUp ? 'Already have an account? Log in.' : "New to Flippl? Sign up for free."}
              </button>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}