import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import { Mail } from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";
import Features from "./Features";

interface AuthFormProps {
  onSuccess: () => void;
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}`,
        },
      });

      if (error) throw error;

      toast.success("Magic link sent! Check your email to log in.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send magic link."
      );
    } finally {
      setLoading(false);
    }
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
                🚀 Join for Free
              </h2>
              <p className="text-gray-600 mb-8 text-center">
                Start tracking your trading journey with Flippl. Because
                guessing isn't a strategy.
              </p>

              <form onSubmit={handleMagicLink} className="space-y-6">
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
                  {loading ? "Sending Magic Link..." : "Send Magic Link"}
                </button>
              </form>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
