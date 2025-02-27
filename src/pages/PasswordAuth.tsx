import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import Section from "../components/layout/Section";
import AppLayout from "../components/layout/AppLayout";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

interface PasswordAuthProps {
  onSuccess: () => void;
}

export default function PasswordAuth({ onSuccess }: PasswordAuthProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

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
      toast.error(
        error instanceof Error
          ? error.message
          : "Authentication failed. Try again"
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
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send reset email. Try again"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <Section
        title={isSignUp ? "🚀 Create Account" : "🔐 Welcome Back"}
        subtitle={
          isSignUp
            ? "Join Flippl for free and start flipping your trades."
            : "Enter your credentials to continue using Flippl."
        }
      >
        <Section.Content>
          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
            <Input
              id="email"
              type="email"
              label="Email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="anh@hoang"
              required
              minLength={5}
              maxLength={50}
              disabled={loading}
            />

            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              label="Password"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="******"
              required
              minLength={6}
              maxLength={50}
              disabled={loading}
              rightElement={
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
              }
            />

            {!isSignUp && (
              <div className="flex justify-end">
                <Button
                  variant="link"
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  disabled={loading}
                  className="text-sm"
                >
                  Forgot password?
                </Button>
              </div>
            )}

            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading
                ? isSignUp
                  ? "Signing Up..."
                  : "Logging In..."
                : isSignUp
                ? "Sign Up"
                : "Log In"}
            </Button>

            <div className="flex flex-col text-center pt-2 gap-2">
              <Button
                variant="link"
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                disabled={loading}
              >
                {isSignUp
                  ? "Already have an account? Log in"
                  : "Need an account? Sign up"}
              </Button>

              <Link
                to="/"
                className="text-blue-600 hover:text-blue-800 font-bold"
              >
                Or login via magic link
              </Link>
            </div>
          </form>
        </Section.Content>
      </Section>
    </AppLayout>
  );
}
