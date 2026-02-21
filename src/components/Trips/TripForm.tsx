import { useState, useEffect } from "react";
import {
  tripAPI,
  vehicleAPI,
  driverAPI,
  Trip,
  Vehicle,
  Driver,
} from "../../lib/db";
import { useAuth } from "../../contexts/AuthContext";
import { X, AlertTriangle } from "lucide-react";

interface TripFormProps {
  trip: Trip | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TripForm({ trip, onClose, onSuccess }: TripFormProps) {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [formData, setFormData] = useState({
    vehicle_id: "",
    driver_id: "",
    cargo_weight: "",
    origin: "",
    destination: "",
    estimated_distance: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    loadVehiclesAndDrivers();
  }, []);

  useEffect(() => {
    if (trip) {
      setFormData({
        vehicle_id: trip.vehicle_id,
        driver_id: trip.driver_id,
        cargo_weight: trip.cargo_weight.toString(),
        origin: trip.origin,
        destination: trip.destination,
        estimated_distance: trip.estimated_distance.toString(),
      });
    }
  }, [trip]);

  useEffect(() => {
    validateForm();
  }, [formData, vehicles, drivers]);

  async function loadVehiclesAndDrivers() {
    try {
      const [vehiclesData, driversData] = await Promise.all([
        vehicleAPI.getAll(),
        driverAPI.getAll(),
      ]);

      setVehicles(vehiclesData);
      setDrivers(driversData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  function validateForm() {
    const newWarnings: string[] = [];

    if (formData.vehicle_id && formData.cargo_weight) {
      const selectedVehicle = vehicles.find(
        (v) => v.id === formData.vehicle_id,
      );
      if (selectedVehicle) {
        const cargoWeight = parseFloat(formData.cargo_weight);
        if (cargoWeight > selectedVehicle.max_load_capacity) {
          newWarnings.push(
            `Cargo weight (${cargoWeight} kg) exceeds vehicle capacity (${selectedVehicle.max_load_capacity} kg)`,
          );
        }
        if (selectedVehicle.status !== "Available") {
          newWarnings.push(
            `Vehicle is currently ${selectedVehicle.status.toLowerCase()}`,
          );
        }
      }
    }

    if (formData.driver_id) {
      const selectedDriver = drivers.find((d) => d.id === formData.driver_id);
      if (selectedDriver) {
        const expiryDate = new Date(selectedDriver.license_expiry);
        const today = new Date();
        if (expiryDate < today) {
          newWarnings.push("Driver license has expired");
        }
        if (selectedDriver.status === "Suspended") {
          newWarnings.push("Driver is currently suspended");
        }
        if (selectedDriver.status === "On Duty") {
          newWarnings.push("Driver is currently on duty");
        }
      }
    }

    setWarnings(newWarnings);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (warnings.length > 0) {
      setError("Cannot create trip: Please resolve all validation errors");
      return;
    }

    setLoading(true);

    try {
      const selectedVehicle = vehicles.find(
        (v) => v.id === formData.vehicle_id,
      );
      const selectedDriver = drivers.find((d) => d.id === formData.driver_id);

      if (!selectedVehicle || !selectedDriver) {
        throw new Error("Invalid vehicle or driver selection");
      }

      const cargoWeight = parseFloat(formData.cargo_weight);
      if (cargoWeight > selectedVehicle.max_load_capacity) {
        throw new Error("Cargo weight exceeds vehicle capacity");
      }

      if (selectedVehicle.status !== "Available") {
        throw new Error("Vehicle is not available");
      }

      const expiryDate = new Date(selectedDriver.license_expiry);
      if (expiryDate < new Date()) {
        throw new Error("Driver license has expired");
      }

      if (selectedDriver.status === "Suspended") {
        throw new Error("Driver is suspended");
      }

      if (selectedDriver.status === "On Duty") {
        throw new Error("Driver is already on duty");
      }

      const data = {
        vehicle_id: formData.vehicle_id,
        driver_id: formData.driver_id,
        cargo_weight: cargoWeight,
        origin: formData.origin,
        destination: formData.destination,
        estimated_distance: parseFloat(formData.estimated_distance),
        status: "Draft" as const,
        created_by: user?.id || null,
        actual_distance: 0,
        dispatched_at: null,
        completed_at: null,
      };

      if (trip) {
        const {
          status,
          created_by,
          actual_distance,
          dispatched_at,
          completed_at,
          ...updateData
        } = data;
        await tripAPI.update(trip.id, updateData);
      } else {
        await tripAPI.create(data);
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save trip");
    } finally {
      setLoading(false);
    }
  }

  const availableVehicles = vehicles.filter((v) => v.status === "Available");
  const availableDrivers = drivers.filter((d) => {
    const expiryDate = new Date(d.license_expiry);
    return (
      d.status !== "Suspended" &&
      d.status !== "On Duty" &&
      expiryDate >= new Date()
    );
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">
            {trip ? "Edit Trip" : "Create New Trip"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {warnings.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800 mb-2">
                    Validation Errors
                  </h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    {warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Vehicle
              </label>
              <select
                value={formData.vehicle_id}
                onChange={(e) =>
                  setFormData({ ...formData, vehicle_id: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none bg-white"
                required
              >
                <option value="">Select a vehicle</option>
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.license_plate}) - Max {v.max_load_capacity} kg
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                {availableVehicles.length} available
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Driver
              </label>
              <select
                value={formData.driver_id}
                onChange={(e) =>
                  setFormData({ ...formData, driver_id: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none bg-white"
                required
              >
                <option value="">Select a driver</option>
                {availableDrivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} - {d.license_category}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                {availableDrivers.length} available
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Cargo Weight (kg)
              </label>
              <input
                type="number"
                value={formData.cargo_weight}
                onChange={(e) =>
                  setFormData({ ...formData, cargo_weight: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                placeholder="e.g., 2500"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Estimated Distance (km)
              </label>
              <input
                type="number"
                value={formData.estimated_distance}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimated_distance: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                placeholder="e.g., 350"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Origin
              </label>
              <input
                type="text"
                value={formData.origin}
                onChange={(e) =>
                  setFormData({ ...formData, origin: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                placeholder="e.g., Warehouse A"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Destination
              </label>
              <input
                type="text"
                value={formData.destination}
                onChange={(e) =>
                  setFormData({ ...formData, destination: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                placeholder="e.g., Distribution Center B"
                required
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
              disabled={loading || warnings.length > 0}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : trip ? "Update Trip" : "Create Trip"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
