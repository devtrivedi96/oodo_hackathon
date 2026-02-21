import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Truck, Users, Route, Wrench, DollarSign, BarChart3, LogOut } from 'lucide-react';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function Navigation({ currentView, onViewChange }: NavigationProps) {
  const { signOut, profile } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Manager', 'Dispatcher', 'Safety Officer', 'Analyst'] },
    { id: 'vehicles', label: 'Vehicles', icon: Truck, roles: ['Manager', 'Dispatcher', 'Safety Officer', 'Analyst'] },
    { id: 'drivers', label: 'Drivers', icon: Users, roles: ['Manager', 'Dispatcher', 'Safety Officer', 'Analyst'] },
    { id: 'trips', label: 'Trips', icon: Route, roles: ['Manager', 'Dispatcher', 'Analyst'] },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, roles: ['Manager', 'Analyst'] },
    { id: 'expenses', label: 'Expenses', icon: DollarSign, roles: ['Manager', 'Analyst'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['Manager', 'Analyst'] },
  ];

  const visibleItems = menuItems.filter(item =>
    profile && item.roles.includes(profile.role)
  );

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-slate-800">FleetFlow</span>
            </div>

            <div className="hidden md:flex space-x-1">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium text-slate-800">{profile?.full_name}</div>
              <div className="text-xs text-slate-500">{profile?.role}</div>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="md:hidden border-t border-slate-200">
        <div className="flex overflow-x-auto px-4 py-2 space-x-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
