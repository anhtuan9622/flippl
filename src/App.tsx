import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import MainDashboard from "./pages/MainDashboard";
import AuthForm from "./pages/AuthForm";
import PasswordAuth from "./pages/PasswordAuth";
import SharedSummary from "./pages/SharedSummary";
import AuthCallback from "./pages/AuthCallback";
import PasswordReset from "./pages/PasswordReset";
import { useAuth } from "./hooks/useAuth";
import { useTradeData } from "./hooks/useTradeData";
import { safeGetSession } from "./lib/supabase";
import { DayData } from "./types";

function App() {
  const { isAuthenticated, userId, userEmail, setIsAuthenticated, setUserId, setUserEmail, handleSignOut } = useAuth();
  const { tradeData, setTradeData, loading, handleSaveTradeData, handleDeleteTrade, fetchTradeData } = useTradeData(userId);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            !isAuthenticated ? (
              <AuthForm
                onSuccess={() => {
                  setTimeout(async () => {
                    try {
                      const { session } = await safeGetSession();

                      if (session?.user) {
                        setUserId(session.user.id);
                        setUserEmail(session.user.email);
                        setIsAuthenticated(true);
                        const trades: DayData[] = await fetchTradeData();
                        setTradeData(trades);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    } catch (error) {
                      console.error("Authentication error:", error);
                      toast.error("Authentication error. Try again");
                    }
                  }, 0);
                }}
              />
            ) : (
              <MainDashboard
                tradeData={tradeData}
                userEmail={userEmail}
                onSignOut={handleSignOut}
                onSaveTradeData={handleSaveTradeData}
                onDeleteTrade={handleDeleteTrade}
                fetchTradeData={fetchTradeData}
                setTradeData={setTradeData}
                loading={loading}
              />
            )
          }
        />
        <Route
          path="/auth"
          element={
            !isAuthenticated ? (
              <PasswordAuth
                onSuccess={() => {
                  setTimeout(async () => {
                    try {
                      const { session } = await safeGetSession();

                      if (session?.user) {
                        setUserId(session.user.id);
                        setUserEmail(session.user.email);
                        setIsAuthenticated(true);
                        const trades: DayData[] = await fetchTradeData();
                        setTradeData(trades);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    } catch (error) {
                      console.error("Authentication error:", error);
                      toast.error("Authentication error. Try again");
                    }
                  }, 0);
                }}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/reset-password" element={<PasswordReset />} />
        <Route path="/share/:shareId" element={<SharedSummary />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;