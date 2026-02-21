import { useEffect, useState } from "react";
import { driverAPI, Driver } from "../../lib/db";
import { useAuth } from "../../contexts/AuthContext";
import { Plus, Edit2, Trash2, AlertCircle } from "lucide-react";
import DriverForm from "./DriverForm";

export default function DriverManagement() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [filter, setFilter] = useState("all");
  const { hasRole } = useAuth();

  useEffect(() => {
    loadDrivers();
  }, []);

  async function loadDrivers() {
    try {
      const data = await driverAPI.getAll();

      const driversWithStatus = data.map((driver) => {
        const expiryDate = new Date(driver.license_expiry);
        const today = new Date();

        if (expiryDate < today && driver.status !== "Suspended") {
          return { ...driver, status: "Suspended" as const };
        }
        return driver;
      });

      setDrivers(driversWithStatus);
    } catch (error) {
      console.error("Error loading drivers:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this driver?")) return;

    try {
      await driverAPI.delete(id);
      await loadDrivers();
    } catch {
      alert("Error deleting driver. They may be assigned to trips.");
    }
  }

  function handleEdit(driver: Driver) {
    if (!hasRole("Safety Officer") && !hasRole("Manager")) {
      alert("Only Safety Officers and Managers can edit drivers");
      return;
    }
    setEditingDriver(driver);
    setShowForm(true);
  }

  function handleAdd() {
    setEditingDriver(null);
    setShowForm(true);
  }

  async function handleFormSuccess() {
    setShowForm(false);
    setEditingDriver(null);
    await loadDrivers();
  }

  const filteredDrivers = drivers.filter((d) => {
    if (filter === "all") return true;
    return d.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "On Duty":
        return "bg-blue-100 text-blue-700";
      case "Off Duty":
        return "bg-green-100 text-green-700";
      case "Suspended":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const isLicenseExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading drivers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Driver Management
          </h1>
          <p className="text-slate-600 mt-1">
            Track driver compliance and performance
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add Driver</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <div className="flex gap-2 flex-wrap">
            {["all", "On Duty", "Off Duty", "Suspended"].map((status) => (
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
          <table className="w-full min-w-[1050px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Name
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  License Number
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Category
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  License Expiry
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Status
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Completion Rate
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Safety Score
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">
                    No drivers found
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-6 text-sm font-medium text-slate-800">
                      {driver.name}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 font-mono">
                      {driver.license_number}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {driver.license_category}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center space-x-2">
                        <span
                          className={
                            isLicenseExpired(driver.license_expiry)
                              ? "text-red-600 font-medium"
                              : "text-slate-600"
                          }
                        >
                          {new Date(driver.license_expiry).toLocaleDateString()}
                        </span>
                        {isLicenseExpired(driver.license_expiry) && (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}
                      >
                        {driver.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {driver.completion_rate}%
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {driver.safety_score}/100
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(driver)}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(driver.id)}
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
        <DriverForm
          driver={editingDriver}
          onClose={() => {
            setShowForm(false);
            setEditingDriver(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
