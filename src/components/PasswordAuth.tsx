import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import Header from "./Header";
import Footer from "./Footer";

interface PasswordAuthProps {
  onSuccess: () => void;
}

export default function PasswordAuth({ onSuccess }: PasswordAuthProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = isSignUp
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          })
        : await supabase.auth.signInWithPassword({
            email,
            password,
          });

      if (error) throw error;

      if (isSignUp) {
        toast.success("Check your email to confirm your account");
      } else {
        toast.success("Logged in successfully");
        onSuccess();
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error(
        error instanceof Error ? error.message : "Authentication failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      toast.success("Password reset link sent to your email");
    } catch (error) {
      console.error("Error sending reset email:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send reset email"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-yellow-50 px-4 py-8 md:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Header />

        <div className="neo-brutalist-white p-8">
          <div className="max-w-md mx-auto">
            <h2 className="text-3xl font-black text-black mb-2 text-center">
              {isSignUp ? "🚀 Create Account" : "🔐 Welcome Back"}
            </h2>
            <p className="text-gray-600 mb-8 text-center">
              {isSignUp
                ? "Join Flippl for free and start flipping your trades."
                : "Enter your credentials to continue using Flippl."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-black text-black mb-2"
                >
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
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                <label
                  htmlFor="password"
                  className="block text-sm font-black text-black mb-2"
                >
                  Password
                </label>

              {!isSignUp && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-blue-600 hover:text-blue-800 font-bold text-sm mb-1"
                >
                  Forgot password?
                </button>
              )}
                </div>
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
                    disabled={loading}
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

              <button
                type="submit"
                disabled={loading}
                className="neo-brutalist-blue w-full py-3 font-bold disabled:opacity-50"
              >
                {loading
                  ? isSignUp
                    ? "Signing Up..."
                    : "Logging In..."
                  : isSignUp
                  ? "Sign Up"
                  : "Log In"}
              </button>

              <div className="text-center space-y-4">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-blue-600 hover:text-blue-800 font-bold"
                >
                  {isSignUp
                    ? "Already have an account? Log in"
                    : "Need an account? Sign up"}
                </button>

                <div>
                  <Link
                    to="/"
                    className="text-blue-600 hover:text-blue-800 font-bold"
                  >
                    Or login via magic link
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}