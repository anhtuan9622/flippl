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
        toast.error("Logged in failed. Try again");
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

  return <p>Logging in...</p>;
}
