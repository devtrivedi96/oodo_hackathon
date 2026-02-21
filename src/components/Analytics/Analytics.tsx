import { useEffect, useState } from "react";
import { vehicleAPI, tripAPI, expenseAPI, maintenanceAPI } from "../../lib/db";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Fuel,
  Wrench,
} from "lucide-react";

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    fuelEfficiency: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    maintenanceCost: 0,
    fuelCost: 0,
    vehicleUtilization: 0,
    completedTrips: 0,
    activeVehicles: 0,
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      const [vehiclesData, tripsData, expensesData, maintenanceData] =
        await Promise.all([
          vehicleAPI.getAll(),
          tripAPI.getAll(),
          expenseAPI.getAll(),
          maintenanceAPI.getAll(),
        ]);

      const completedTrips = tripsData.filter((t) => t.status === "Completed");
      const totalDistance = completedTrips.reduce(
        (sum, t) => sum + (t.actual_distance || 0),
        0,
      );
      const totalFuelLiters = expensesData.reduce(
        (sum, e) => sum + e.fuel_liters,
        0,
      );
      const fuelEfficiency =
        totalFuelLiters > 0 ? totalDistance / totalFuelLiters : 0;

      const totalFuelCost = expensesData.reduce(
        (sum, e) => sum + e.fuel_cost,
        0,
      );
      const totalMiscCost = expensesData.reduce(
        (sum, e) => sum + e.misc_cost,
        0,
      );
      const totalMaintenanceCost = maintenanceData.reduce(
        (sum, m) => sum + m.cost,
        0,
      );
      const totalExpenses =
        totalFuelCost + totalMiscCost + totalMaintenanceCost;

      const estimatedRevenue = completedTrips.length * 500;

      const activeVehicles = vehiclesData.filter(
        (v) => v.status !== "Retired",
      ).length;
      const onTripVehicles = vehiclesData.filter(
        (v) => v.status === "On Trip",
      ).length;
      const utilization =
        activeVehicles > 0 ? (onTripVehicles / activeVehicles) * 100 : 0;

      setAnalytics({
        fuelEfficiency,
        totalRevenue: estimatedRevenue,
        totalExpenses,
        netProfit: estimatedRevenue - totalExpenses,
        maintenanceCost: totalMaintenanceCost,
        fuelCost: totalFuelCost,
        vehicleUtilization: utilization,
        completedTrips: completedTrips.length,
        activeVehicles,
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Analytics & Reports
        </h1>
        <p className="text-slate-600 mt-1">Performance metrics and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Fuel Efficiency
              </p>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                {analytics.fuelEfficiency.toFixed(2)} km/L
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Fuel className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Total Revenue
              </p>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                ${analytics.totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">Estimated</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Total Expenses
              </p>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                ${analytics.totalExpenses.toLocaleString()}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Net Profit</p>
              <p
                className={`text-3xl font-bold mt-2 ${analytics.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                ${analytics.netProfit.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-100 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-slate-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Maintenance Cost
              </p>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                ${analytics.maintenanceCost.toLocaleString()}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Wrench className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Fuel Cost</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                ${analytics.fuelCost.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-100 p-3 rounded-lg">
              <Fuel className="h-6 w-6 text-slate-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-600">
            Vehicle Utilization
          </p>
          <p className="text-3xl font-bold text-slate-800 mt-2">
            {analytics.vehicleUtilization.toFixed(1)}%
          </p>
          <div className="mt-4 bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${analytics.vehicleUtilization}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Completed Trips</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">
            {analytics.completedTrips}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Active Vehicles</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">
            {analytics.activeVehicles}
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Cost Breakdown
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">Fuel Costs</span>
            <span className="text-sm font-medium text-blue-900">
              ${analytics.fuelCost.toLocaleString()} (
              {analytics.totalExpenses > 0
                ? (
                    (analytics.fuelCost / analytics.totalExpenses) *
                    100
                  ).toFixed(1)
                : 0}
              %)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">Maintenance Costs</span>
            <span className="text-sm font-medium text-blue-900">
              ${analytics.maintenanceCost.toLocaleString()} (
              {analytics.totalExpenses > 0
                ? (
                    (analytics.maintenanceCost / analytics.totalExpenses) *
                    100
                  ).toFixed(1)
                : 0}
              %)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
