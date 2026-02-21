import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  DollarSign,
  BarChart3,
  LogOut,
  Menu,
  X,
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { signOut, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["Manager", "Dispatcher", "Safety Officer", "Analyst"],
    },
    {
      id: "vehicles",
      label: "Vehicles",
      icon: Truck,
      roles: ["Manager", "Dispatcher", "Safety Officer", "Analyst"],
    },
    {
      id: "drivers",
      label: "Drivers",
      icon: Users,
      roles: ["Manager", "Dispatcher", "Safety Officer", "Analyst"],
    },
    {
      id: "trips",
      label: "Trips",
      icon: Route,
      roles: ["Manager", "Dispatcher", "Analyst"],
    },
    {
      id: "maintenance",
      label: "Maintenance",
      icon: Wrench,
      roles: ["Manager", "Analyst"],
    },
    {
      id: "expenses",
      label: "Expenses",
      icon: DollarSign,
      roles: ["Manager", "Analyst"],
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      roles: ["Manager", "Analyst"],
    },
  ];

  const visibleItems = menuItems.filter(
    (item) => profile && item.roles.includes(profile.role),
  );

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-blue-600 text-white p-2 rounded-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white shadow-xl transition-transform duration-300 z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">FleetFlow</h1>
              <p className="text-xs text-slate-400">Fleet Management</p>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-slate-700">
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-sm font-medium">
              {profile?.full_name || "User"}
            </p>
            <p className="text-xs text-slate-400">{profile?.role}</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onViewChange(item.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-blue-300 rounded-full"></div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout button */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
}
