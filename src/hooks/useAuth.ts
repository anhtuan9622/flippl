import { useState, useEffect, useCallback } from 'react';
import { supabase, safeGetSession } from '../lib/supabase';
import toast from 'react-hot-toast';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setUserId(null);
      setUserEmail(null);
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Failed to sign out:", error);
      toast.error("Failed to sign out. Try again");
    } finally {
      setLoading(false);
    }
  };

  const initializeAuth = useCallback(async () => {
    try {
      const { session } = await safeGetSession();
      
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email);
        setIsAuthenticated(true);
      } else {
        setUserId(null);
        setUserEmail(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      toast.error("Auth init error. Try again");
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setTimeout(async () => {
        if (!mounted) return;

        try {
          if (session?.user) {
            setUserId(session.user.id);
            setUserEmail(session.user.email);
            setIsAuthenticated(true);
          } else {
            setUserId(null);
            setUserEmail(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error("Auth state change error:", error);
          setIsAuthenticated(false);
        } finally {
          setLoading(false);
        }
      }, 0);
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initializeAuth]);

  return {
    isAuthenticated,
    userId,
    userEmail,
    setIsAuthenticated,
    setUserId,
    setUserEmail,
    loading,
    isInitialLoad,
    handleSignOut,
  };
}