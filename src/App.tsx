import { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Sidebar from "./components/Layout/Sidebar";
import Dashboard from "./components/Dashboard/Dashboard";
import VehicleRegistry from "./components/Vehicles/VehicleRegistry";
import DriverManagement from "./components/Drivers/DriverManagement";
import TripDispatcher from "./components/Trips/TripDispatcher";
import MaintenanceLogs from "./components/Maintenance/MaintenanceLogs";
import ExpenseTracking from "./components/Expenses/ExpenseTracking";
import Analytics from "./components/Analytics/Analytics";

function AppContent() {
  const { user, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600 text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return showRegister ? (
      <Register onToggle={() => setShowRegister(false)} />
    ) : (
      <Login onToggle={() => setShowRegister(true)} />
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
      <AppContent />
    </AuthProvider>
  );
}

export default App;
