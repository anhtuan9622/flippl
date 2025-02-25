import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "implicit",
    debug: import.meta.env.DEV,
    storage: {
      getItem: (key) => {
        try {
          // Try both sessionStorage and localStorage for better persistence
          const value = sessionStorage.getItem(key) || localStorage.getItem(key);
          return value;
        } catch (e) {
          console.warn('Error reading from storage:', e);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          // Store in both for redundancy
          localStorage.setItem(key, value);
          sessionStorage.setItem(key, value);
        } catch (e) {
          console.warn('Error writing to storage:', e);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch (e) {
          console.warn('Error removing from storage:', e);
        }
      },
    },
  },
});

// Track last token refresh time
let lastTokenRefresh = Date.now();

// Add auth state change handler for token refreshes
supabase.auth.onAuthStateChange((event, session) => {
  // Handle token refresh events
  if (event === 'TOKEN_REFRESHED' && session?.access_token) {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastTokenRefresh;
    lastTokenRefresh = now;
    
    console.log(`Access token refreshed after ${timeSinceLastRefresh/1000}s`);
    
    // Dispatch a custom event that components can listen for
    setTimeout(() => {
      // Use dispatchEvent to avoid deadlocks with Supabase
      window.dispatchEvent(new CustomEvent('supabase:token-refreshed', {
        detail: { 
          time: now,
          user: session.user
        }
      }));
    }, 0);
  }
});

// Export a function to check if token was recently refreshed
export const wasTokenRecentlyRefreshed = (timeWindow = 5000) => {
  return (Date.now() - lastTokenRefresh) < timeWindow;
};

// Helper for safely getting session
export const safeGetSession = () => {
  return new Promise((resolve) => {
    setTimeout(async () => {
      try {
        const response = await supabase.auth.getSession();
        resolve(response.data);
      } catch (error) {
        console.error("Error in safeGetSession:", error);
        resolve({ session: null, error });
      }
    }, 0);
  });
};