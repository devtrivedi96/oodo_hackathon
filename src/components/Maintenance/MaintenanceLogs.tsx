import { useEffect, useState } from "react";
import {
  maintenanceAPI,
  vehicleAPI,
  MaintenanceLog,
  Vehicle,
} from "../../lib/db";
import { Plus, CheckCircle } from "lucide-react";
import MaintenanceForm from "./MaintenanceForm";

interface MaintenanceWithVehicle extends MaintenanceLog {
  vehicle: Vehicle | null;
}

export default function MaintenanceLogs() {
  const [logs, setLogs] = useState<MaintenanceWithVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      const logs = await maintenanceAPI.getAll();
      const vehicles = await vehicleAPI.getAll();

      // Join logs with vehicles
      const logsWithVehicles = logs.map((log) => ({
        ...log,
        vehicle: vehicles.find((v) => v.id === log.vehicle_id) || null,
      }));

      setLogs(logsWithVehicles as MaintenanceWithVehicle[]);
    } catch (error) {
      console.error("Error loading maintenance logs:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleClose(logId: string, vehicleId: string) {
    try {
      // Close the maintenance log
      await maintenanceAPI.update(logId, { status: "Closed" });

      // Update vehicle status back to Available
      await vehicleAPI.update(vehicleId, { status: "Available" });

      await loadLogs();
    } catch (error) {
      alert("Error closing maintenance log");
    }
  }

  async function handleFormSuccess() {
    setShowForm(false);
    await loadLogs();
  }

  const filteredLogs = logs.filter((log) => {
    if (filter === "all") return true;
    return log.status === filter;
  });

  const getStatusColor = (status: string) => {
    return status === "Open"
      ? "bg-orange-100 text-orange-700"
      : "bg-green-100 text-green-700";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading maintenance logs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Maintenance Logs
          </h1>
          <p className="text-slate-600 mt-1">
            Track vehicle service and repairs
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus className="h-4 w-4" />
          <span>Log Maintenance</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <div className="flex gap-2">
            {["all", "Open", "Closed"].map((status) => (
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
            ))}
          </div>
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
                  Service Type
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Cost
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Status
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Notes
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    No maintenance logs found
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {new Date(log.service_date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-slate-800">
                      {log.vehicle?.name || "N/A"}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {log.service_type}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      ₹{log.cost.toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 max-w-xs truncate">
                      {log.notes || "-"}
                    </td>
                    <td className="py-4 px-6">
                      {log.status === "Open" && (
                        <button
                          onClick={() => handleClose(log.id, log.vehicle_id)}
                          className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition"
                          title="Close"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <MaintenanceForm
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
