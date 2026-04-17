import React, { useState, useEffect } from "react";
import Toaster, { toast } from "react-hot-toast";
import { Header } from "./components/Header";
import { DashboardOverview } from "./components/DashboardOverview";
import { LiveTriggerEvents } from "./components/LiveTriggerEvents";
import { FraudQueueManager } from "./components/FraudQueueManager";
import { LossRatioChart } from "./components/LossRatioChart";
import { PredictiveAlerts } from "./components/PredictiveAlerts";
import { WorkersTable } from "./components/WorkersTable";
import { ZoneHeatmap } from "./components/ZoneHeatmap";

import "./index.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing admin token
    try {
      const token = localStorage.getItem("admin_token");
      if (token) {
        setAdminToken(token);
        setIsLoggedIn(true);
      }
    } catch (err) {
      console.error("Error loading token:", err);
      setError("Failed to load authentication");
    }
  }, []);

  const handleLogin = () => {
    try {
      const token = prompt("Enter admin token:");
      if (token && token.trim()) {
        localStorage.setItem("admin_token", token.trim());
        setAdminToken(token.trim());
        setIsLoggedIn(true);
        setError(null);
        toast.success("Admin access granted!");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed");
      toast.error("Login failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setAdminToken(null);
    setIsLoggedIn(false);
    toast.success("Logged out successfully");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Toaster position="top-right" />
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="font-bold text-white text-3xl">KK</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-100 mb-2">KaryaKavach</h1>
          <p className="text-gray-400 mb-8">Admin Dashboard</p>
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-300 text-sm">
              {error}
            </div>
          )}
          <button
            onClick={handleLogin}
            className="btn btn-primary w-full mb-4"
          >
            Login with Token
          </button>
          <p className="text-xs text-gray-500">
            Use token: <code className="bg-slate-800 px-2 py-1 rounded text-blue-300">dev-admin-token</code> (dev mode)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Toaster position="top-right" />
      <Header onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto p-6">
        {/* Dashboard Overview */}
        <DashboardOverview />

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left Column */}
          <div className="space-y-6">
            <LiveTriggerEvents />
            <ZoneHeatmap />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <FraudQueueManager />
            <PredictiveAlerts />
          </div>
        </div>

        {/* Full Width */}
        <div className="space-y-6">
          <LossRatioChart />
          <WorkersTable />
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-slate-700/50 text-center text-sm text-gray-400">
          <p>KaryaKavach Admin Dashboard v1.0.0 • Last updated: {new Date().toLocaleString()}</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
