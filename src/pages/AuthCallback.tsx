import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import toast from "react-hot-toast";

export default function AuthCallback() {
  const navigate = useNavigate();
  const hasShownToast = useRef(false);

  useEffect(() => {
    const handleSession = async () => {
      if (hasShownToast.current) return;

      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        toast.error("Login failed. Try again");
        navigate("/");
        hasShownToast.current = true;
        return;
      }

      toast.success("Logged in successfully");
      hasShownToast.current = true;
      navigate("/");
    };

    handleSession();
  }, [navigate]);

  return (
    <AppLayout loading={true}>
      <div />
    </AppLayout>
  );
}