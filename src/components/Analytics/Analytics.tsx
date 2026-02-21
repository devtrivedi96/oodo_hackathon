import { useEffect, useState } from "react";
import { vehicleAPI, tripAPI, expenseAPI, maintenanceAPI } from "../../lib/db";
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Fuel,
  Wrench,
  RefreshCw,
  Download,
  FileText,
} from "lucide-react";

const toFiniteNumber = (value: unknown) => {
  const parsed =
    typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatINR = (value: unknown) =>
  `₹${toFiniteNumber(value).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
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
    vehicleROI: 0,
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      setRefreshing(true);
      const [vehiclesData, tripsData, expensesData, maintenanceData] =
        await Promise.all([
          vehicleAPI.getAll(),
          tripAPI.getAll(),
          expenseAPI.getAll(),
          maintenanceAPI.getAll(),
        ]);

      const completedTrips = tripsData.filter((t) => t.status === "Completed");
      const totalDistance = completedTrips.reduce(
        (sum, t) => sum + toFiniteNumber(t.actual_distance),
        0,
      );
      const totalFuelLiters = expensesData.reduce(
        (sum, e) => sum + toFiniteNumber(e.fuel_liters),
        0,
      );
      const fuelEfficiency =
        totalFuelLiters > 0 ? totalDistance / totalFuelLiters : 0;

      const totalFuelCost = expensesData.reduce(
        (sum, e) => sum + toFiniteNumber(e.fuel_cost),
        0,
      );
      const totalMiscCost = expensesData.reduce(
        (sum, e) => sum + toFiniteNumber(e.misc_cost),
        0,
      );
      const totalMaintenanceCost = maintenanceData.reduce(
        (sum, m) => sum + toFiniteNumber(m.cost),
        0,
      );
      const totalExpenses =
        totalFuelCost + totalMiscCost + totalMaintenanceCost;

      const totalRevenue = completedTrips.reduce(
        (sum, t) => sum + toFiniteNumber(t.revenue),
        0,
      );

      const activeVehicles = vehiclesData.filter(
        (v) => v.status !== "Retired",
      ).length;
      const totalAcquisitionCost = vehiclesData.reduce(
        (sum, v) => sum + toFiniteNumber(v.acquisition_cost),
        0,
      );
      const onTripVehicles = vehiclesData.filter(
        (v) => v.status === "On Trip",
      ).length;
      const utilization =
        activeVehicles > 0 ? (onTripVehicles / activeVehicles) * 100 : 0;
      const vehicleROI =
        totalAcquisitionCost > 0
          ? ((totalRevenue - (totalMaintenanceCost + totalFuelCost)) /
              totalAcquisitionCost) *
            100
          : 0;

      setAnalytics({
        fuelEfficiency,
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        maintenanceCost: totalMaintenanceCost,
        fuelCost: totalFuelCost,
        vehicleUtilization: utilization,
        completedTrips: completedTrips.length,
        activeVehicles,
        vehicleROI,
      });
      setLastUpdated(new Date().toLocaleString());
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading analytics...</div>
      </div>
    );
  }

  function exportCSV() {
    const rows = [
      ["Metric", "Value"],
      ["Fuel Efficiency (km/L)", analytics.fuelEfficiency.toFixed(2)],
      ["Total Revenue", analytics.totalRevenue.toFixed(2)],
      ["Total Expenses", analytics.totalExpenses.toFixed(2)],
      ["Net Profit", analytics.netProfit.toFixed(2)],
      ["Maintenance Cost", analytics.maintenanceCost.toFixed(2)],
      ["Fuel Cost", analytics.fuelCost.toFixed(2)],
      ["Vehicle Utilization (%)", analytics.vehicleUtilization.toFixed(1)],
      ["Completed Trips", String(analytics.completedTrips)],
      ["Active Vehicles", String(analytics.activeVehicles)],
      ["Vehicle ROI (%)", analytics.vehicleROI.toFixed(2)],
    ];

    const csvContent = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    window.print();
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Analytics & Reports
            </h1>
            <p className="text-slate-600 mt-1">
              Performance metrics and financial insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-slate-500">
              Last updated: {lastUpdated || "Just now"}
            </p>
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button
              onClick={exportPDF}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition"
            >
              <FileText className="h-4 w-4" />
              PDF
            </button>
            <button
              onClick={loadAnalytics}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>
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
                {formatINR(analytics.totalRevenue)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Completed Trips</p>
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
                {formatINR(analytics.totalExpenses)}
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
                {formatINR(analytics.netProfit)}
              </p>
            </div>
            <div className="bg-slate-100 p-3 rounded-lg">
              <IndianRupee className="h-6 w-6 text-slate-600" />
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
                {formatINR(analytics.maintenanceCost)}
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
                {formatINR(analytics.fuelCost)}
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

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Vehicle ROI</p>
          <p
            className={`text-3xl font-bold mt-2 ${analytics.vehicleROI >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {analytics.vehicleROI.toFixed(2)}%
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
              {formatINR(analytics.fuelCost)} (
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
              {formatINR(analytics.maintenanceCost)} (
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
