import { useState, useEffect } from "react";
import { vehicleAPI, tripAPI, expenseAPI, Vehicle, Trip } from "../../lib/db";
import { X } from "lucide-react";

interface ExpenseFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_USD_TO_INR = Number(import.meta.env.VITE_USD_TO_INR) || 83;
type Currency = "USD" | "INR";

const parseNonNegative = (value: string) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const roundToTwo = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export default function ExpenseForm({ onClose, onSuccess }: ExpenseFormProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currency, setCurrency] = useState<Currency>("USD");
  const [usdToInrRate, setUsdToInrRate] = useState(
    DEFAULT_USD_TO_INR.toString(),
  );
  const [formData, setFormData] = useState({
    vehicle_id: "",
    trip_id: "",
    fuel_liters: "",
    fuel_price_per_liter: "",
    misc_cost: "",
    expense_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.vehicle_id) {
      loadTripsForVehicle(formData.vehicle_id);
    }
  }, [formData.vehicle_id]);

  async function loadData() {
    try {
      const data = await vehicleAPI.getAll();
      // Filter out retired vehicles
      setVehicles(data.filter((v) => v.status !== "Retired"));
    } catch (error) {
      console.error("Error loading vehicles:", error);
    }
  }

  async function loadTripsForVehicle(vehicleId: string) {
    try {
      const allTrips = await tripAPI.getAll();
      // Filter trips for this vehicle
      const filteredTrips = allTrips.filter((t) => t.vehicle_id === vehicleId);
      setTrips(filteredTrips.slice(0, 20));
    } catch (error) {
      console.error("Error loading trips:", error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const exchangeRate = Math.max(parseNonNegative(usdToInrRate), 1);
    const fuelLiters = parseNonNegative(formData.fuel_liters);
    const fuelPricePerLiter = parseNonNegative(formData.fuel_price_per_liter);
    const fuelCostInInputCurrency = fuelLiters * fuelPricePerLiter;
    const fuelCostUSD =
      currency === "USD"
        ? fuelCostInInputCurrency
        : fuelCostInInputCurrency / exchangeRate;
    const miscCostInput = parseNonNegative(formData.misc_cost);
    const miscCostUSD =
      currency === "USD" ? miscCostInput : miscCostInput / exchangeRate;

    try {
      await expenseAPI.create({
        vehicle_id: formData.vehicle_id,
        trip_id: formData.trip_id || null,
        fuel_liters: roundToTwo(fuelLiters),
        fuel_cost: roundToTwo(fuelCostUSD),
        misc_cost: roundToTwo(miscCostUSD),
        expense_date: formData.expense_date,
        notes: formData.notes || null,
      });

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log expense");
    } finally {
      setLoading(false);
    }
  }

  const exchangeRate = Math.max(parseNonNegative(usdToInrRate), 1);
  const fuelLiters = parseNonNegative(formData.fuel_liters);
  const fuelPricePerLiter = parseNonNegative(formData.fuel_price_per_liter);
  const fuelCostInInputCurrency = fuelLiters * fuelPricePerLiter;
  const fuelCostUSD =
    currency === "USD"
      ? fuelCostInInputCurrency
      : fuelCostInInputCurrency / exchangeRate;
  const fuelCostINR = fuelCostUSD * exchangeRate;
  const miscCostInput = parseNonNegative(formData.misc_cost);
  const miscCostUSD =
    currency === "USD" ? miscCostInput : miscCostInput / exchangeRate;
  const miscCostINR = miscCostUSD * exchangeRate;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full">
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">Log Expense</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Input Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none bg-white"
              >
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                USD to INR Rate
              </label>
              <input
                type="number"
                value={usdToInrRate}
                onChange={(e) => setUsdToInrRate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                min="1"
                step="0.01"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Vehicle
              </label>
              <select
                value={formData.vehicle_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vehicle_id: e.target.value,
                    trip_id: "",
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none bg-white"
                required
              >
                <option value="">Select a vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.license_plate})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Trip (Optional)
              </label>
              <select
                value={formData.trip_id}
                onChange={(e) =>
                  setFormData({ ...formData, trip_id: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none bg-white"
                disabled={!formData.vehicle_id}
              >
                <option value="">Not linked to a trip</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.origin} → {t.destination} ({t.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fuel Liters
              </label>
              <input
                type="number"
                value={formData.fuel_liters}
                onChange={(e) =>
                  setFormData({ ...formData, fuel_liters: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                placeholder="e.g., 100"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fuel Price Per Liter ({currency})
              </label>
              <input
                type="number"
                value={formData.fuel_price_per_liter}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fuel_price_per_liter: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                placeholder={currency === "USD" ? "e.g., 3.9" : "e.g., 95"}
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fuel Cost (Auto)
              </label>
              <input
                type="text"
                value={
                  fuelCostInInputCurrency > 0
                    ? `${currency === "USD" ? "$" : "₹"}${fuelCostInInputCurrency.toFixed(2)}`
                    : ""
                }
                readOnly
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700"
                placeholder="Auto-calculated from liters"
              />
              <p className="text-xs text-slate-500 mt-1">
                Stored as ${fuelCostUSD.toFixed(2)} (₹{fuelCostINR.toFixed(2)})
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Miscellaneous Cost ({currency})
              </label>
              <input
                type="number"
                value={formData.misc_cost}
                onChange={(e) =>
                  setFormData({ ...formData, misc_cost: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                placeholder="e.g., 25"
                min="0"
                step="0.01"
              />
              <p className="text-xs text-slate-500 mt-1">
                Stored as ${miscCostUSD.toFixed(2)} (₹{miscCostINR.toFixed(2)})
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Expense Date
              </label>
              <input
                type="date"
                value={formData.expense_date}
                onChange={(e) =>
                  setFormData({ ...formData, expense_date: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                placeholder="Additional details..."
                rows={3}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Log Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
