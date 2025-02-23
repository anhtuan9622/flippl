import { createClient } from "@supabase/supabase-js";
import { BroadcastChannel } from "broadcast-channel";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Get the site URL based on environment
const siteUrl = window.location.origin;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Create a broadcast channel for cross-tab communication
export const authChannel = new BroadcastChannel("auth_channel");

// Custom fetch implementation with retries, exponential backoff, and auth handling
const customFetch = async (url: string, options: any): Promise<Response> => {
  const maxRetries = 3;
  const baseDelay = 1000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Ensure auth header is present
      const headers = new Headers(options.headers);
      if (!headers.has("apikey")) {
        headers.set("apikey", supabaseAnonKey);
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle auth errors specifically
      if (response.status === 401 || response.status === 403) {
        // Try to refresh the session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          headers.set("Authorization", `Bearer ${session.access_token}`);
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });
          if (retryResponse.ok) {
            return retryResponse;
          }
        }
        // Broadcast auth error to other tabs
        authChannel.postMessage({ type: "AUTH_ERROR" });
        throw new Error("Authentication failed");
      }

      // Only retry on network errors or 5xx server errors
      if (response.ok || response.status < 500) {
        return response;
      }

      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      if (isLastAttempt) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay =
        baseDelay * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Max retries reached");
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "implicit",
    debug: import.meta.env.DEV,
    redirectTo: `${siteUrl}/auth/callback`,
    storageKey: "flippl.auth.token",
    cookieOptions: {
      name: "flippl_auth",
      domain: window.location.hostname,
      sameSite: "Lax",
      secure: window.location.protocol === "https:",
      path: "/",
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      "x-client-info": "flippl-app",
      apikey: supabaseAnonKey,
    },
    fetch: customFetch,
  },
});

// Subscribe to trades changes with automatic reconnection
export const subscribeToTrades = (userId: string, onUpdate: () => void) => {
  let retryCount = 0;
  const maxRetries = 5;
  const baseDelay = 1000;

  const setupSubscription = () => {
    const channel = supabase
      .channel(`trades_channel_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trades",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          onUpdate();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          retryCount = 0;
        } else if (status === "CLOSED" && retryCount < maxRetries) {
          const delay = baseDelay * Math.pow(2, retryCount);
          retryCount++;
          setTimeout(() => {
            setupSubscription();
          }, delay);
        }
      });

    return channel;
  };

  return setupSubscription();
};

// Helper function to check if there's a valid session
export const checkSession = async () => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    return { session, error: null };
  } catch (error) {
    console.error("Error checking session:", error);
    return { session: null, error };
  }
};

// Helper function to handle sign out
export const signOut = async () => {
  try {
    // First, remove all realtime subscriptions
    const { data: subscriptions } = await supabase.getSubscriptions();
    await Promise.all(
      subscriptions.map((subscription) => supabase.removeChannel(subscription))
    );

    // Clear local storage and broadcast channel
    localStorage.clear();
    await authChannel.postMessage({ type: "SIGN_OUT" });

    // Sign out from Supabase - only local scope to avoid 403 errors
    const { error } = await supabase.auth.signOut({
      scope: "local",
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Error signing out:", error);
    return { error };
  }
};

// Helper function to check Supabase connection
export const checkConnection = async () => {
  try {
    const { error } = await supabase.from("trades").select("count").limit(1);
    return !error;
  } catch {
    return false;
  }
};

// Retry function with exponential backoff and jitter
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const jitter = Math.random() * 0.5 + 0.5;
        const delay = baseDelay * Math.pow(2, attempt) * jitter;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

// Helper function to ensure API key is present
export const ensureApiKey = () => {
  if (!supabase.supabaseKey) {
    supabase.supabaseKey = supabaseAnonKey;
  }
  return supabase.supabaseKey;
};
