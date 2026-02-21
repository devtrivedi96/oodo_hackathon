import { useState, useEffect } from "react";
import { vehicleAPI, Vehicle } from "../../lib/db";
import { X } from "lucide-react";

interface VehicleFormProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function VehicleForm({
  vehicle,
  onClose,
  onSuccess,
}: VehicleFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    license_plate: "",
    max_load_capacity: "",
    odometer: "",
    acquisition_cost: "",
    vehicle_type: "Truck",
    region: "",
    status: "Available" as Vehicle["status"],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (vehicle) {
      setFormData({
        name: vehicle.name,
        license_plate: vehicle.license_plate,
        max_load_capacity: vehicle.max_load_capacity.toString(),
        odometer: vehicle.odometer.toString(),
        acquisition_cost: vehicle.acquisition_cost.toString(),
        vehicle_type: vehicle.vehicle_type,
        region: vehicle.region || "",
        status: vehicle.status,
      });
    }
  }, [vehicle]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (vehicle) {
        if (parseFloat(formData.odometer) < vehicle.odometer) {
          throw new Error("Odometer value cannot decrease");
        }
      }

      const data = {
        name: formData.name,
        license_plate: formData.license_plate,
        max_load_capacity: parseFloat(formData.max_load_capacity),
        odometer: parseFloat(formData.odometer),
        acquisition_cost: parseFloat(formData.acquisition_cost),
        vehicle_type: formData.vehicle_type,
        region: formData.region || null,
        status: formData.status,
      };

      if (vehicle) {
        await vehicleAPI.update(vehicle.id, data);
      } else {
        await vehicleAPI.create(data);
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save vehicle");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">
            {vehicle ? "Edit Vehicle" : "Add New Vehicle"}
          </h2>
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
                Vehicle Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                placeholder="e.g., Volvo FH16"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                License Plate
              </label>
              <input
                type="text"
                value={formData.license_plate}
                onChange={(e) =>
                  setFormData({ ...formData, license_plate: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                placeholder="e.g., ABC-1234"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Vehicle Type
              </label>
              <select
                value={formData.vehicle_type}
                onChange={(e) =>
                  setFormData({ ...formData, vehicle_type: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none bg-white"
                required
              >
                <option value="Truck">Truck</option>
                <option value="Van">Van</option>
                <option value="Pickup">Pickup</option>
                <option value="Semi-Trailer">Semi-Trailer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Max Load Capacity (kg)
              </label>
              <input
                type="number"
                value={formData.max_load_capacity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_load_capacity: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                placeholder="e.g., 5000"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Odometer (km)
              </label>
              <input
                type="number"
                value={formData.odometer}
                onChange={(e) =>
                  setFormData({ ...formData, odometer: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                placeholder="e.g., 50000"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Acquisition Cost
              </label>
              <input
                type="number"
                value={formData.acquisition_cost}
                onChange={(e) =>
                  setFormData({ ...formData, acquisition_cost: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                placeholder="e.g., 150000"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Region
              </label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) =>
                  setFormData({ ...formData, region: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                placeholder="e.g., North Region"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as Vehicle["status"],
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none bg-white"
                required
              >
                <option value="Available">Available</option>
                <option value="On Trip">On Trip</option>
                <option value="In Shop">In Shop</option>
                <option value="Retired">Retired</option>
              </select>
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
              {loading
                ? "Saving..."
                : vehicle
                  ? "Update Vehicle"
                  : "Add Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
