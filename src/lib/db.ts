import axios, { AxiosInstance } from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Initialize API client
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type UserRole = "Manager" | "Dispatcher" | "Safety Officer" | "Analyst";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface Vehicle {
  id: string;
  name: string;
  license_plate: string;
  max_load_capacity: number;
  odometer: number;
  acquisition_cost: number;
  status: "Available" | "On Trip" | "In Shop" | "Retired";
  vehicle_type: string;
  region: string | null;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  name: string;
  license_number: string;
  license_category: string;
  license_expiry: string;
  status: "On Duty" | "Off Duty" | "Suspended";
  completion_rate: number;
  safety_score: number;
  created_at: string;
  updated_at: string;
}

export interface Trip {
  id: string;
  vehicle_id: string;
  driver_id: string;
  cargo_weight: number;
  origin: string;
  destination: string;
  estimated_distance: number;
  actual_distance: number | null;
  status: "Draft" | "Dispatched" | "Completed" | "Cancelled";
  dispatched_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceLog {
  id: string;
  vehicle_id: string;
  service_type: string;
  cost: number;
  service_date: string;
  notes: string | null;
  status: "Open" | "Closed";
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  trip_id: string | null;
  vehicle_id: string;
  fuel_liters: number;
  fuel_cost: number;
  misc_cost: number;
  expense_date: string;
  notes: string | null;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

export interface AuthUser {
  id: string;
  email: string;
}

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed =
    typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeVehicle = (vehicle: Vehicle): Vehicle => ({
  ...vehicle,
  max_load_capacity: toNumber(vehicle.max_load_capacity),
  odometer: toNumber(vehicle.odometer),
  acquisition_cost: toNumber(vehicle.acquisition_cost),
});

const normalizeTrip = (trip: Trip): Trip => ({
  ...trip,
  cargo_weight: toNumber(trip.cargo_weight),
  estimated_distance: toNumber(trip.estimated_distance),
  actual_distance:
    trip.actual_distance === null ? null : toNumber(trip.actual_distance),
});

const normalizeMaintenance = (log: MaintenanceLog): MaintenanceLog => ({
  ...log,
  cost: toNumber(log.cost),
});

const normalizeExpense = (expense: Expense): Expense => ({
  ...expense,
  fuel_liters: toNumber(expense.fuel_liters),
  fuel_cost: toNumber(expense.fuel_cost),
  misc_cost: toNumber(expense.misc_cost),
});

// ================= AUTH API =================

export const authAPI = {
  // Register (Send OTP)
  async signUp(
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
  ) {
    const { data } = await api.post("/auth/register", {
      name: fullName,
      email,
      password,
      role,
    });

    // Backend only sends message + email
    return data;
  },

  // Verify OTP
  async verifyOTP(email: string, otp: string) {
    const { data } = await api.post("/auth/verify-otp", {
      email,
      otp,
    });

    return data;
  },

  // Login (After OTP verified)
  async signIn(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/login", {
      email,
      password,
    });

    // Store token + user info
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("user_id", data.user.id);
    localStorage.setItem("user_email", data.user.email);
    localStorage.setItem("user_role", data.user.role);

    return data;
  },

  async signOut() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_email");
  },

  // Protected Route
  async getProfile() {
    const { data } = await api.get("/auth/me");
    return data.user;
  },
};

// Vehicle API
export const vehicleAPI = {
  async getAll(): Promise<Vehicle[]> {
    const { data } = await api.get<Vehicle[]>("/vehicles");
    return data.map(normalizeVehicle);
  },

  async getById(id: string): Promise<Vehicle> {
    const { data } = await api.get<Vehicle>(`/vehicles/${id}`);
    return normalizeVehicle(data);
  },

  async create(
    vehicle: Omit<Vehicle, "id" | "created_at" | "updated_at">,
  ): Promise<Vehicle> {
    const { data } = await api.post<Vehicle>("/vehicles", vehicle);
    return normalizeVehicle(data);
  },

  async update(id: string, vehicle: Partial<Vehicle>): Promise<Vehicle> {
    const { data } = await api.put<Vehicle>(`/vehicles/${id}`, vehicle);
    return normalizeVehicle(data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/vehicles/${id}`);
  },
};

// Driver API
export const driverAPI = {
  async getAll(): Promise<Driver[]> {
    const { data } = await api.get<Driver[]>("/drivers");
    return data;
  },

  async getById(id: string): Promise<Driver> {
    const { data } = await api.get<Driver>(`/drivers/${id}`);
    return data;
  },

  async create(
    driver: Omit<Driver, "id" | "created_at" | "updated_at">,
  ): Promise<Driver> {
    const { data } = await api.post<Driver>("/drivers", driver);
    return data;
  },

  async update(id: string, driver: Partial<Driver>): Promise<Driver> {
    const { data } = await api.put<Driver>(`/drivers/${id}`, driver);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/drivers/${id}`);
  },
};

// Trip API
export const tripAPI = {
  async getAll(): Promise<Trip[]> {
    const { data } = await api.get<Trip[]>("/trips");
    return data.map(normalizeTrip);
  },

  async getById(id: string): Promise<Trip> {
    const { data } = await api.get<Trip>(`/trips/${id}`);
    return normalizeTrip(data);
  },

  async create(
    trip: Omit<Trip, "id" | "created_at" | "updated_at">,
  ): Promise<Trip> {
    const { data } = await api.post<Trip>("/trips", trip);
    return normalizeTrip(data);
  },

  async update(id: string, trip: Partial<Trip>): Promise<Trip> {
    const { data } = await api.put<Trip>(`/trips/${id}`, trip);
    return normalizeTrip(data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/trips/${id}`);
  },
};

// Maintenance API
export const maintenanceAPI = {
  async getAll(): Promise<MaintenanceLog[]> {
    const { data } = await api.get<MaintenanceLog[]>("/maintenance");
    return data.map(normalizeMaintenance);
  },

  async getByVehicle(vehicleId: string): Promise<MaintenanceLog[]> {
    const { data } = await api.get<MaintenanceLog[]>(
      `/maintenance/vehicle/${vehicleId}`,
    );
    return data.map(normalizeMaintenance);
  },

  async getById(id: string): Promise<MaintenanceLog> {
    const { data } = await api.get<MaintenanceLog>(`/maintenance/${id}`);
    return normalizeMaintenance(data);
  },

  async create(
    log: Omit<MaintenanceLog, "id" | "created_at" | "updated_at">,
  ): Promise<MaintenanceLog> {
    const { data } = await api.post<MaintenanceLog>("/maintenance", log);
    return normalizeMaintenance(data);
  },

  async update(
    id: string,
    log: Partial<MaintenanceLog>,
  ): Promise<MaintenanceLog> {
    const { data } = await api.put<MaintenanceLog>(`/maintenance/${id}`, log);
    return normalizeMaintenance(data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/maintenance/${id}`);
  },
};

// Expense API
export const expenseAPI = {
  async getAll(): Promise<Expense[]> {
    const { data } = await api.get<Expense[]>("/expenses");
    return data.map(normalizeExpense);
  },

  async getByVehicle(vehicleId: string): Promise<Expense[]> {
    const { data } = await api.get<Expense[]>(`/expenses/vehicle/${vehicleId}`);
    return data.map(normalizeExpense);
  },

  async getByTrip(tripId: string): Promise<Expense[]> {
    const { data } = await api.get<Expense[]>(`/expenses/trip/${tripId}`);
    return data.map(normalizeExpense);
  },

  async getById(id: string): Promise<Expense> {
    const { data } = await api.get<Expense>(`/expenses/${id}`);
    return normalizeExpense(data);
  },

  async create(expense: Omit<Expense, "id" | "created_at">): Promise<Expense> {
    const { data } = await api.post<Expense>("/expenses", expense);
    return normalizeExpense(data);
  },

  async update(id: string, expense: Partial<Expense>): Promise<Expense> {
    const { data } = await api.put<Expense>(`/expenses/${id}`, expense);
    return normalizeExpense(data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },
};

export default api;
