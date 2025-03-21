import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import AppLayout from "../components/layout/AppLayout";
import Features from "../components/Features";
import Section from "../components/layout/Section";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

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

              <Button
                variant="primary"
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? "Sending Magic Link..." : "Login via Magic Link"}
              </Button>

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
