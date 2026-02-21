import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

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
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState("dashboard");

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-slate-50 lg:ml-64">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="p-4 sm:p-6 lg:p-8">
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