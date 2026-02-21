import { useState, useEffect } from "react";
import { driverAPI, Driver } from "../../lib/db";
import { X } from "lucide-react";

interface DriverFormProps {
  driver: Driver | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DriverForm({
  driver,
  onClose,
  onSuccess,
}: DriverFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    license_number: "",
    license_category: "B",
    license_expiry: "",
    status: "Off Duty" as Driver["status"],
    completion_rate: "0",
    safety_score: "100",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (driver) {
      setFormData({
        name: driver.name,
        license_number: driver.license_number,
        license_category: driver.license_category,
        license_expiry: driver.license_expiry,
        status: driver.status,
        completion_rate: driver.completion_rate.toString(),
        safety_score: driver.safety_score.toString(),
      });
    }
  }, [driver]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const expiryDate = new Date(formData.license_expiry);
      const today = new Date();
      let status = formData.status;

      if (expiryDate < today) {
        status = "Suspended";
      }

      const data = {
        name: formData.name,
        license_number: formData.license_number,
        license_category: formData.license_category,
        license_expiry: formData.license_expiry,
        status,
        completion_rate: parseFloat(formData.completion_rate),
        safety_score: parseFloat(formData.safety_score),
      };

      if (driver) {
        await driverAPI.update(driver.id, data);
      } else {
        await driverAPI.create(data);
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save driver");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">
            {driver ? "Edit Driver" : "Add New Driver"}
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                placeholder="e.g., John Smith"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                License Number
              </label>
              <input
                type="text"
                value={formData.license_number}
                onChange={(e) =>
                  setFormData({ ...formData, license_number: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                placeholder="e.g., DL123456789"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                License Category
              </label>
              <select
                value={formData.license_category}
                onChange={(e) =>
                  setFormData({ ...formData, license_category: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none bg-white"
                required
              >
                <option value="B">B - Light vehicles</option>
                <option value="C">C - Medium trucks</option>
                <option value="CE">CE - Heavy trucks with trailer</option>
                <option value="D">D - Buses</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                License Expiry Date
              </label>
              <input
                type="date"
                value={formData.license_expiry}
                onChange={(e) =>
                  setFormData({ ...formData, license_expiry: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                required
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
                    status: e.target.value as Driver["status"],
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none bg-white"
                required
              >
                <option value="On Duty">On Duty</option>
                <option value="Off Duty">Off Duty</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Completion Rate (%)
              </label>
              <input
                type="number"
                value={formData.completion_rate}
                onChange={(e) =>
                  setFormData({ ...formData, completion_rate: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                min="0"
                max="100"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Safety Score (0-100)
              </label>
              <input
                type="number"
                value={formData.safety_score}
                onChange={(e) =>
                  setFormData({ ...formData, safety_score: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                min="0"
                max="100"
                step="0.01"
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
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Saving..." : driver ? "Update Driver" : "Add Driver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
