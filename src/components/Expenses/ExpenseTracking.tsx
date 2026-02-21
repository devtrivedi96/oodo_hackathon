import { useEffect, useState } from "react";
import {
  expenseAPI,
  vehicleAPI,
  tripAPI,
  Expense,
  Vehicle,
  Trip,
} from "../../lib/db";
import { Plus } from "lucide-react";
import ExpenseForm from "./ExpenseForm";

interface ExpenseWithDetails extends Expense {
  vehicle: Vehicle | null;
  trip: Trip | null;
}

const DEFAULT_USD_TO_INR = Number(import.meta.env.VITE_USD_TO_INR) || 83;
type Currency = "USD" | "INR";

const parseNonNegative = (value: string) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_USD_TO_INR;
};

export default function ExpenseTracking() {
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>("USD");
  const [usdToInrRate, setUsdToInrRate] = useState(
    DEFAULT_USD_TO_INR.toString(),
  );
  const [stats, setStats] = useState({
    totalFuelCost: 0,
    totalMiscCost: 0,
    totalCost: 0,
    avgCostPerKm: 0,
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    try {
      const [expenses, vehicles, trips] = await Promise.all([
        expenseAPI.getAll(),
        vehicleAPI.getAll(),
        tripAPI.getAll(),
      ]);

      // Join expenses with vehicles and trips
      const expensesData: ExpenseWithDetails[] = expenses.map((expense) => ({
        ...expense,
        vehicle: vehicles.find((v) => v.id === expense.vehicle_id) || null,
        trip: trips.find((t) => t.id === expense.trip_id) || null,
      }));

      setExpenses(expensesData);

      const totalFuel = expensesData.reduce((sum, e) => sum + e.fuel_cost, 0);
      const totalMisc = expensesData.reduce((sum, e) => sum + e.misc_cost, 0);
      const total = totalFuel + totalMisc;

      const tripsWithDistance = expensesData.filter(
        (e) => e.trip?.actual_distance,
      );
      const totalDistance = tripsWithDistance.reduce(
        (sum, e) => sum + (e.trip?.actual_distance || 0),
        0,
      );
      const avgPerKm = totalDistance > 0 ? total / totalDistance : 0;

      setStats({
        totalFuelCost: totalFuel,
        totalMiscCost: totalMisc,
        totalCost: total,
        avgCostPerKm: avgPerKm,
      });
    } catch (error) {
      console.error("Error loading expenses:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFormSuccess() {
    setShowForm(false);
    await loadExpenses();
  }

  const exchangeRate = Math.max(parseNonNegative(usdToInrRate), 1);
  const toDisplayAmount = (amountUSD: number) =>
    displayCurrency === "USD" ? amountUSD : amountUSD * exchangeRate;
  const currencySymbol = displayCurrency === "USD" ? "$" : "₹";
  const formatMoney = (amountUSD: number) =>
    `${currencySymbol}${toDisplayAmount(amountUSD).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading expenses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Expense Tracking
          </h1>
          <p className="text-slate-600 mt-1">
            Monitor fuel and operational costs
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus className="h-4 w-4" />
          <span>Log Expense</span>
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 md:items-end">
        <div>
          <label className="block text-xs font-medium text-slate-600 uppercase mb-1">
            Display Currency
          </label>
          <select
            value={displayCurrency}
            onChange={(e) => setDisplayCurrency(e.target.value as Currency)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none bg-white"
          >
            <option value="USD">USD ($)</option>
            <option value="INR">INR (₹)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 uppercase mb-1">
            USD to INR Rate
          </label>
          <input
            type="number"
            value={usdToInrRate}
            onChange={(e) => setUsdToInrRate(e.target.value)}
            min="1"
            step="0.01"
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Total Fuel Cost</p>
          <p className="text-2xl font-bold text-slate-800 mt-2">{formatMoney(stats.totalFuelCost)}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Total Misc Cost</p>
          <p className="text-2xl font-bold text-slate-800 mt-2">{formatMoney(stats.totalMiscCost)}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Total Cost</p>
          <p className="text-2xl font-bold text-slate-800 mt-2">{formatMoney(stats.totalCost)}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Avg Cost per KM</p>
          <p className="text-2xl font-bold text-slate-800 mt-2">
            {currencySymbol}
            {toDisplayAmount(stats.avgCostPerKm).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">
            Expense History
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Date
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Vehicle
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Trip ID
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Fuel Liters
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Fuel Cost
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Misc Cost
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Total
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">
                    No expenses logged
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {new Date(expense.expense_date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-slate-800">
                      {expense.vehicle?.name || "N/A"}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 font-mono">
                      {expense.trip_id ? expense.trip_id.slice(0, 8) : "-"}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {expense.fuel_liters.toLocaleString()} L
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {formatMoney(expense.fuel_cost)}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {formatMoney(expense.misc_cost)}
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-slate-800">
                      {formatMoney(expense.fuel_cost + expense.misc_cost)}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 max-w-xs truncate">
                      {expense.notes || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <ExpenseForm
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
