import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function AuthCallback() {
  const navigate = useNavigate();
  const hasShownToast = useRef(false); // Prevent duplicate toasts

  useEffect(() => {
    const handleSession = async () => {
      if (hasShownToast.current) return; // Prevent multiple executions

      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        toast.error("Login failed. Please try again");
        navigate("/");
        hasShownToast.current = true; // Mark toast as shown
        return;
      }

      toast.success("Logged in successfully");
      hasShownToast.current = true; // Mark toast as shown
      navigate("/");
    };

    handleSession();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
      <div className="text-xl font-bold text-black neo-brutalist-white px-8 py-4">
        Logging in...
      </div>
    </div>
  );
}