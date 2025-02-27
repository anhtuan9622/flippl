import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import AppLayout from "../components/layout/AppLayout";
import Features from "../components/Features";
import Section from "../components/layout/Section";

interface AuthFormProps {
  onSuccess: () => void;
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let errorMessage = "";

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        if (error.message.includes("user_already_exists")) {
          const { error: signInError } = await supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (signInError) throw signInError;
        } else {
          throw error;
        }
      }

      toast.success("Check your email for the magic link");
    } catch (error) {
      errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send magic link. Try again";

      errorMessage = errorMessage
        .replace("Failed to send magic link:", "")
        .replace("AuthApiError:", "")
        .trim();

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="grid gap-8">
        <Features
          title="⚡ Track Your Trades. No Fluff. Just P/L."
          description="Flippl helps you log, analyze, and make sense of your trading performance with clean insights—no distractions, no BS."
        />

        <Section
          title="🚀 Join for Free"
          subtitle="Start tracking your trading journey with Flippl. Because guessing isn't a strategy."
        >
          <Section.Content>
            <form
              onSubmit={handleMagicLink}
              className="max-w-md mx-auto space-y-6"
            >
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
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="neo-brutalist-blue w-full py-3 font-bold disabled:opacity-50"
              >
                {loading ? "Sending Magic Link..." : "Login via Magic Link"}
              </button>

              <div className="text-center">
                <Link
                  to="/auth"
                  className="text-blue-600 hover:text-blue-800 font-bold"
                >
                  Or login with password
                </Link>
              </div>
            </form>
          </Section.Content>
        </Section>
      </div>
    </AppLayout>
  );
}
