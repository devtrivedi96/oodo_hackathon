import { useEffect, useState } from "react";
import { vehicleAPI, Vehicle } from "../../lib/db";
import { useAuth } from "../../contexts/AuthContext";
import { Plus, Edit2, Trash2, Archive } from "lucide-react";
import VehicleForm from "./VehicleForm";

export default function VehicleRegistry() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [filter, setFilter] = useState("all");
  const { hasRole } = useAuth();

  useEffect(() => {
    loadVehicles();
  }, []);

  async function loadVehicles() {
    try {
      const data = await vehicleAPI.getAll();
      setVehicles(data);
    } catch (error) {
      console.error("Error loading vehicles:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this vehicle?")) return;

    try {
      await vehicleAPI.delete(id);
      await loadVehicles();
    } catch (error) {
      alert("Error deleting vehicle. It may be assigned to trips.");
    }
  }

  async function handleRetire(vehicle: Vehicle) {
    if (!hasRole("Manager")) {
      alert("Only Managers can retire vehicles");
      return;
    }

    if (!confirm("Are you sure you want to retire this vehicle?")) return;

    try {
      await vehicleAPI.update(vehicle.id, { status: "Retired" });
      await loadVehicles();
    } catch (error) {
      alert("Error retiring vehicle");
    }
  }

  function handleEdit(vehicle: Vehicle) {
    if (vehicle.status === "Retired") {
      alert("Cannot edit retired vehicles");
      return;
    }
    setEditingVehicle(vehicle);
    setShowForm(true);
  }

  function handleAdd() {
    setEditingVehicle(null);
    setShowForm(true);
  }

  async function handleFormSuccess() {
    setShowForm(false);
    setEditingVehicle(null);
    await loadVehicles();
  }

  const filteredVehicles = vehicles.filter((v) => {
    if (filter === "all") return true;
    return v.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-700";
      case "On Trip":
        return "bg-blue-100 text-blue-700";
      case "In Shop":
        return "bg-orange-100 text-orange-700";
      case "Retired":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading vehicles...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Vehicle Registry
          </h1>
          <p className="text-slate-600 mt-1">Manage your fleet assets</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add Vehicle</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <div className="flex gap-2">
            {["all", "Available", "On Trip", "In Shop", "Retired"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filter === status
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {status === "all" ? "All" : status}
                </button>
              ),
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Name
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  License Plate
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Type
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Max Capacity
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Odometer
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Status
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    No vehicles found
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-6 text-sm font-medium text-slate-800">
                      {vehicle.name}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 font-mono">
                      {vehicle.license_plate}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {vehicle.vehicle_type}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {vehicle.max_load_capacity} kg
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {vehicle.odometer.toLocaleString()} km
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}
                      >
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(vehicle)}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {hasRole("Manager") && vehicle.status !== "Retired" && (
                          <button
                            onClick={() => handleRetire(vehicle)}
                            className="p-2 hover:bg-slate-50 text-slate-600 rounded-lg transition"
                            title="Retire"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(vehicle.id)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <VehicleForm
          vehicle={editingVehicle}
          onClose={() => {
            setShowForm(false);
            setEditingVehicle(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
