import { useEffect, useState } from "react";
import {
  tripAPI,
  vehicleAPI,
  driverAPI,
  Trip,
  Vehicle,
  Driver,
} from "../../lib/db";
import { useAuth } from "../../contexts/AuthContext";
import { Plus, CheckCircle, XCircle } from "lucide-react";
import TripForm from "./TripForm";

interface TripWithDetails extends Trip {
  vehicle: Vehicle | null;
  driver: Driver | null;
}

export default function TripDispatcher() {
  const [trips, setTrips] = useState<TripWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [filter, setFilter] = useState("all");
  const { hasAnyRole } = useAuth();

  const canCreateTrips = hasAnyRole(["Dispatcher", "Manager"]);

  useEffect(() => {
    loadTrips();
  }, []);

  async function loadTrips() {
    try {
      const [tripsData, vehicles, drivers] = await Promise.all([
        tripAPI.getAll(),
        vehicleAPI.getAll(),
        driverAPI.getAll(),
      ]);

      // Join trips with vehicles and drivers
      const tripsWithDetails: TripWithDetails[] = tripsData.map((trip) => ({
        ...trip,
        vehicle: vehicles.find((v) => v.id === trip.vehicle_id) || null,
        driver: drivers.find((d) => d.id === trip.driver_id) || null,
      }));

      setTrips(tripsWithDetails);
    } catch (error) {
      console.error("Error loading trips:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    setEditingTrip(null);
    setShowForm(true);
  }

  async function handleDispatch(trip: Trip) {
    if (!canCreateTrips) {
      alert("Only Dispatchers and Managers can dispatch trips");
      return;
    }

    try {
      await tripAPI.update(trip.id, {
        status: "Dispatched" as const,
        dispatched_at: new Date().toISOString(),
      });

      await vehicleAPI.update(trip.vehicle_id, {
        status: "On Trip" as const,
      });

      await driverAPI.update(trip.driver_id, {
        status: "On Duty" as const,
      });

      await loadTrips();
    } catch (error) {
      alert("Error dispatching trip");
    }
  }

  async function handleComplete(trip: TripWithDetails) {
    const actualDistance = prompt("Enter actual distance traveled (km):");
    if (!actualDistance || isNaN(parseFloat(actualDistance))) return;

    try {
      await tripAPI.update(trip.id, {
        status: "Completed" as const,
        completed_at: new Date().toISOString(),
        actual_distance: parseFloat(actualDistance),
      });

      if (trip.vehicle) {
        const newOdometer = trip.vehicle.odometer + parseFloat(actualDistance);
        await vehicleAPI.update(trip.vehicle_id, {
          status: "Available" as const,
          odometer: newOdometer,
        });
      }

      await driverAPI.update(trip.driver_id, {
        status: "Off Duty" as const,
      });

      await loadTrips();
    } catch (error) {
      alert("Error completing trip");
    }
  }

  async function handleCancel(trip: Trip) {
    if (!canCreateTrips) {
      alert("Only Dispatchers and Managers can cancel trips");
      return;
    }

    try {
      await tripAPI.update(trip.id, {
        status: "Cancelled" as const,
      });

      if (trip.status === "Dispatched") {
        await vehicleAPI.update(trip.vehicle_id, {
          status: "Available" as const,
        });
        await driverAPI.update(trip.driver_id, {
          status: "Off Duty" as const,
        });
      }

      await loadTrips();
    } catch (error) {
      alert("Error cancelling trip");
    }
  }

  async function handleFormSuccess() {
    setShowForm(false);
    setEditingTrip(null);
    await loadTrips();
  }

  const filteredTrips = trips.filter((t) => {
    if (filter === "all") return true;
    return t.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "bg-slate-100 text-slate-700";
      case "Dispatched":
        return "bg-blue-100 text-blue-700";
      case "Completed":
        return "bg-green-100 text-green-700";
      case "Cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading trips...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Trip Dispatcher</h1>
          <p className="text-slate-600 mt-1">
            Create and manage logistics trips
          </p>
        </div>
        {canCreateTrips && (
          <button
            onClick={handleAdd}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create Trip</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <div className="flex gap-2 flex-wrap">
            {["all", "Draft", "Dispatched", "Completed", "Cancelled"].map(
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
                  Trip ID
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Vehicle
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Driver
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Route
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Cargo
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-600 uppercase">
                  Distance
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
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">
                    No trips found
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-6 text-sm text-slate-600 font-mono">
                      {trip.id.slice(0, 8)}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-800">
                      {trip.vehicle?.license_plate || "N/A"}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-800">
                      {trip.driver?.name || "N/A"}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      <div>
                        {trip.origin} → {trip.destination}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {trip.cargo_weight} kg
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {trip.actual_distance || trip.estimated_distance} km
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}
                      >
                        {trip.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        {trip.status === "Draft" && canCreateTrips && (
                          <button
                            onClick={() => handleDispatch(trip)}
                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition"
                            title="Dispatch"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {trip.status === "Dispatched" && (
                          <button
                            onClick={() => handleComplete(trip)}
                            className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition"
                            title="Complete"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {(trip.status === "Draft" ||
                          trip.status === "Dispatched") && (
                          <button
                            onClick={() => handleCancel(trip)}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition"
                            title="Cancel"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
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
        <TripForm
          trip={editingTrip}
          onSuccess={handleFormSuccess}
          onClose={() => {
            setShowForm(false);
            setEditingTrip(null);
          }}
        />
      )}
    </div>
  );
}
