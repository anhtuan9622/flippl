import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import AppLayout from "../components/layout/AppLayout";
import Section from "../components/layout/Section";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function PasswordReset() {
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast.error(error.message || "Failed to update password");
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === "USER_UPDATED") {
          toast.success("Password updated successfully");
          setTimeout(() => navigate("/"), 500);
        }
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, [navigate]);

  return (
    <AppLayout>
      <Section
        title="🔑 Reset Password"
        subtitle="Enter the new password you want to update."
      >
        <Section.Content>
          <form
            onSubmit={handlePasswordReset}
            className="max-w-md mx-auto space-y-6"
          >
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              label="Password"
              icon={Lock}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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

            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Updating..." : "Update"}
            </Button>
          </form>
        </Section.Content>
      </Section>
    </AppLayout>
  );
}
