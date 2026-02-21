import { useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AppView, canRoleAccessView, getAllowedViewsForRole } from "./lib/access";

import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import VerifyOTP from "./components/Auth/VerifyOTP";

import Sidebar from "./components/Layout/Sidebar";
import Dashboard from "./components/Dashboard/Dashboard";
import VehicleRegistry from "./components/Vehicles/VehicleRegistry";
import DriverManagement from "./components/Drivers/DriverManagement";
import TripDispatcher from "./components/Trips/TripDispatcher";
import MaintenanceLogs from "./components/Maintenance/MaintenanceLogs";
import ExpenseTracking from "./components/Expenses/ExpenseTracking";
import Analytics from "./components/Analytics/Analytics";

function ProtectedLayout() {
  const { user, profile, loading } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>("dashboard");
  const allowedViews = useMemo(
    () => (profile ? getAllowedViewsForRole(profile.role) : []),
    [profile],
  );

  useEffect(() => {
    if (!profile) return;
    if (!allowedViews.includes(currentView)) {
      setCurrentView(allowedViews[0] || "dashboard");
    }
  }, [allowedViews, currentView, profile]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (!profile) return <div className="p-6 text-slate-600">Loading profile...</div>;

  if (!canRoleAccessView(profile.role, currentView)) {
    return (
      <div className="min-h-screen bg-slate-50 lg:ml-64">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        <main className="p-6 sm:p-8">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-xl">
            <h2 className="text-xl font-semibold text-slate-800">Access Denied</h2>
            <p className="text-slate-600 mt-2">
              You do not have permission to access this feature with the current role.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:ml-64">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="p-4 pt-20 sm:p-6 sm:pt-24 lg:p-8 lg:pt-8">
        {currentView === "dashboard" && <Dashboard />}
        {currentView === "vehicles" && <VehicleRegistry />}
        {currentView === "drivers" && <DriverManagement />}
        {currentView === "trips" && <TripDispatcher />}
        {currentView === "maintenance" && <MaintenanceLogs />}
        {currentView === "expenses" && <ExpenseTracking />}
        {currentView === "analytics" && <Analytics />}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
