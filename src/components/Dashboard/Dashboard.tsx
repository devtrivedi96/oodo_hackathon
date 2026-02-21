import { useEffect, useState } from "react";
import {
  vehicleAPI,
  tripAPI,
  driverAPI,
  Vehicle,
  Trip,
  Driver,
} from "../../lib/db";
import { Truck, AlertTriangle, Activity, Package } from "lucide-react";

interface DashboardStats {
  activeFleet: number;
  maintenanceAlerts: number;
  utilizationRate: number;
  pendingCargo: number;
}

interface TripWithDetails extends Trip {
  vehicle: Vehicle | null;
  driver: Driver | null;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    activeFleet: 0,
    maintenanceAlerts: 0,
    utilizationRate: 0,
    pendingCargo: 0,
  });
  const [trips, setTrips] = useState<TripWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    vehicleType: "all",
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const [vehicles, trips, drivers] = await Promise.all([
        vehicleAPI.getAll(),
        tripAPI.getAll(),
        driverAPI.getAll(),
      ]);

      // Join trips with vehicles and drivers
      const tripsWithDetails: TripWithDetails[] = trips
        .slice(0, 20)
        .map((trip) => ({
          ...trip,
          vehicle: vehicles.find((v) => v.id === trip.vehicle_id) || null,
          driver: drivers.find((d) => d.id === trip.driver_id) || null,
        }));

      const totalVehicles = vehicles.filter(
        (v: Vehicle) => v.status !== "Retired",
      ).length;
      const activeVehicles = vehicles.filter(
        (v: Vehicle) => v.status === "On Trip",
      ).length;
      const inShop = vehicles.filter(
        (v: Vehicle) => v.status === "In Shop",
      ).length;
      const draftTrips = trips.filter((t: Trip) => t.status === "Draft").length;

      setStats({
        activeFleet: activeVehicles,
        maintenanceAlerts: inShop,
        utilizationRate:
          totalVehicles > 0
            ? Math.round((activeVehicles / totalVehicles) * 100)
            : 0,
        pendingCargo: draftTrips,
      });

      setTrips(tripsWithDetails);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredTrips = trips.filter((trip) => {
    if (filters.status !== "all" && trip.status !== filters.status)
      return false;
    if (
      filters.vehicleType !== "all" &&
      trip.vehicle?.vehicle_type !== filters.vehicleType
    )
      return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Dispatched":
        return "bg-blue-100 text-blue-700";
      case "Completed":
        return "bg-green-100 text-green-700";
      case "Cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Fleet</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                {stats.activeFleet}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Maintenance Alerts
              </p>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                {stats.maintenanceAlerts}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Utilization Rate
              </p>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                {stats.utilizationRate}%
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Pending Cargo
              </p>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                {stats.pendingCargo}
              </p>
            </div>
            <div className="bg-slate-100 p-3 rounded-lg">
              <Package className="h-6 w-6 text-slate-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Recent Trips</h2>
          <div className="flex gap-4 mt-4">
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Trip ID
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Driver
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Cargo
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Destination
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    No trips found
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-6 text-sm text-slate-600 font-mono">
                      {trip.id.slice(0, 8)}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-800">
                      {trip.vehicle?.name || "N/A"}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-800">
                      {trip.driver?.name || "N/A"}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}
                      >
                        {trip.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {trip.cargo_weight} kg
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-800">
                      {trip.destination}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
