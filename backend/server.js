import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import pool from "./config/database.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
import authRoutes from "./server/routes/authRoutes.js";

// Middleware
app.use(express.json());
app.use(cors());
app.use("/api/auth", authRoutes);

// Helper function to convert ISO timestamp to MySQL DATETIME format
const formatMySQLDateTime = (isoString) => {
  if (!isoString) return null;
  const date = new Date(isoString);
  return date.toISOString().slice(0, 19).replace("T", " ");
};

// Helper function to convert ISO date to MySQL DATE format
const formatMySQLDate = (isoString) => {
  if (!isoString) return null;
  const date = new Date(isoString);
  return date.toISOString().slice(0, 10);
};

// Helper function to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid token" });
  }
};

// ==================== AUTH ROUTES ====================

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, full_name, password, role } = req.body;

    if (!email || !password || !full_name) {
      return res
        .status(400)
        .json({ error: "Email, password, and full_name are required" });
    }

    const connection = await pool.getConnection();

    // Check if user exists
    const [existing] = await connection.query(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );

    if (existing.length > 0) {
      connection.release();
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await connection.query(
      "INSERT INTO users (email, full_name, password_hash, role) VALUES (?, ?, ?, ?)",
      [email, full_name, hashedPassword, role || "Analyst"],
    );

    // Fetch the created user to get the UUID
    const [users] = await connection.query(
      "SELECT id, created_at FROM users WHERE email = ?",
      [email],
    );

    connection.release();

    const userId = users[0].id;
    const createdAt = users[0].created_at;

    // Generate token
    const token = jwt.sign(
      { id: userId, email, role: role || "Analyst" },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      token,
      user: {
        id: userId,
        email,
        full_name,
        role: role || "Analyst",
        created_at: createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const connection = await pool.getConnection();
    const [users] = await connection.query(
      "SELECT id, email, password_hash, full_name, role FROM users WHERE email = ?",
      [email],
    );

    connection.release();

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("Sign in error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email, new_password } = req.body;

    if (!email || !new_password) {
      return res
        .status(400)
        .json({ error: "Email and new_password are required" });
    }

    if (String(new_password).length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters" });
    }

    const connection = await pool.getConnection();
    const [users] = await connection.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);

    if (!Array.isArray(users) || users.length === 0) {
      connection.release();
      return res.status(404).json({ error: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await connection.query(
      "UPDATE users SET password_hash = ? WHERE email = ?",
      [hashedPassword, email],
    );
    connection.release();

    res.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/auth/profile", verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.query(
      "SELECT id, email, full_name, role, created_at FROM users WHERE id = ?",
      [req.user.id],
    );
    connection.release();

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== VEHICLES ROUTES ====================

app.get("/api/vehicles", verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [vehicles] = await connection.query("SELECT * FROM vehicles");
    connection.release();
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/vehicles/:id", verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [vehicles] = await connection.query(
      "SELECT * FROM vehicles WHERE id = ?",
      [req.params.id],
    );
    connection.release();

    if (vehicles.length === 0) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    res.json(vehicles[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/vehicles", verifyToken, async (req, res) => {
  try {
    const {
      name,
      license_plate,
      max_load_capacity,
      odometer,
      acquisition_cost,
      status,
      vehicle_type,
      region,
    } = req.body;

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      "INSERT INTO vehicles (name, license_plate, max_load_capacity, odometer, acquisition_cost, status, vehicle_type, region) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        name,
        license_plate,
        max_load_capacity,
        odometer,
        acquisition_cost,
        status || "Available",
        vehicle_type,
        region,
      ],
    );
    connection.release();

    res.status(201).json({
      id: result.insertId,
      name,
      license_plate,
      max_load_capacity,
      odometer,
      acquisition_cost,
      status: status || "Available",
      vehicle_type,
      region,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/vehicles/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = Object.keys(req.body)
      .filter((key) => !["id", "created_at", "updated_at"].includes(key))
      .map((key) => `${key} = ?`)
      .join(", ");

    const values = Object.values(req.body).filter(
      (_, i) =>
        !["id", "created_at", "updated_at"].includes(Object.keys(req.body)[i]),
    );

    const connection = await pool.getConnection();

    // If no fields to update, return current record
    if (!updateFields) {
      const [updated] = await connection.query(
        "SELECT * FROM vehicles WHERE id = ?",
        [id],
      );
      connection.release();
      return res.json(updated[0]);
    }

    await connection.query(`UPDATE vehicles SET ${updateFields} WHERE id = ?`, [
      ...values,
      id,
    ]);
    const [updated] = await connection.query(
      "SELECT * FROM vehicles WHERE id = ?",
      [id],
    );
    connection.release();

    res.json(updated[0]);
  } catch (error) {
    console.error("Vehicle update error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/vehicles/:id", verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query("DELETE FROM vehicles WHERE id = ?", [
      req.params.id,
    ]);
    connection.release();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== DRIVERS ROUTES ====================

app.get("/api/drivers", verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [drivers] = await connection.query("SELECT * FROM drivers");
    connection.release();
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/drivers/:id", verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [drivers] = await connection.query(
      "SELECT * FROM drivers WHERE id = ?",
      [req.params.id],
    );
    connection.release();

    if (drivers.length === 0) {
      return res.status(404).json({ error: "Driver not found" });
    }

    res.json(drivers[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/drivers", verifyToken, async (req, res) => {
  try {
    const {
      name,
      license_number,
      license_category,
      license_expiry,
      status,
      completion_rate,
      safety_score,
    } = req.body;

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      "INSERT INTO drivers (name, license_number, license_category, license_expiry, status, completion_rate, safety_score) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        name,
        license_number,
        license_category,
        license_expiry ? formatMySQLDate(license_expiry) : null,
        status || "Off Duty",
        completion_rate || 0,
        safety_score || 0,
      ],
    );
    connection.release();

    res.status(201).json({
      id: result.insertId,
      name,
      license_number,
      license_category,
      license_expiry: license_expiry ? formatMySQLDate(license_expiry) : null,
      status: status || "Off Duty",
      completion_rate: completion_rate || 0,
      safety_score: safety_score || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/drivers/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Convert ISO date to MySQL format
    const bodyWithFormattedDates = { ...req.body };
    if (bodyWithFormattedDates.license_expiry) {
      bodyWithFormattedDates.license_expiry = formatMySQLDate(
        bodyWithFormattedDates.license_expiry,
      );
    }

    const updateFields = Object.keys(bodyWithFormattedDates)
      .filter((key) => !["id", "created_at", "updated_at"].includes(key))
      .map((key) => `${key} = ?`)
      .join(", ");

    const values = Object.values(bodyWithFormattedDates).filter(
      (_, i) =>
        !["id", "created_at", "updated_at"].includes(
          Object.keys(bodyWithFormattedDates)[i],
        ),
    );

    const connection = await pool.getConnection();

    // If no fields to update, return current record
    if (!updateFields) {
      const [updated] = await connection.query(
        "SELECT * FROM drivers WHERE id = ?",
        [id],
      );
      connection.release();
      return res.json(updated[0]);
    }

    await connection.query(`UPDATE drivers SET ${updateFields} WHERE id = ?`, [
      ...values,
      id,
    ]);
    const [updated] = await connection.query(
      "SELECT * FROM drivers WHERE id = ?",
      [id],
    );
    connection.release();

    res.json(updated[0]);
  } catch (error) {
    console.error("Driver update error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/drivers/:id", verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query("DELETE FROM drivers WHERE id = ?", [req.params.id]);
    connection.release();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== TRIPS ROUTES ====================

app.get("/api/trips", verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [trips] = await connection.query("SELECT * FROM trips");
    connection.release();
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/trips/:id", verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [trips] = await connection.query("SELECT * FROM trips WHERE id = ?", [
      req.params.id,
    ]);
    connection.release();

    if (trips.length === 0) {
      return res.status(404).json({ error: "Trip not found" });
    }

    res.json(trips[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/trips", verifyToken, async (req, res) => {
  try {
    const {
      vehicle_id,
      driver_id,
      cargo_weight,
      origin,
      destination,
      estimated_distance,
      revenue,
      status,
      created_by,
      actual_distance,
      dispatched_at,
      completed_at,
    } = req.body;

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      "INSERT INTO trips (vehicle_id, driver_id, cargo_weight, origin, destination, estimated_distance, revenue, status, created_by, actual_distance, dispatched_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        vehicle_id,
        driver_id,
        cargo_weight,
        origin,
        destination,
        estimated_distance,
        revenue || 0,
        status || "Draft",
        created_by || null,
        actual_distance || 0,
        dispatched_at ? formatMySQLDateTime(dispatched_at) : null,
        completed_at ? formatMySQLDateTime(completed_at) : null,
      ],
    );
    connection.release();

    res.status(201).json({
      id: result.insertId,
      vehicle_id,
      driver_id,
      cargo_weight,
      origin,
      destination,
      estimated_distance,
      revenue: revenue || 0,
      status: status || "Draft",
      created_by: created_by || null,
      actual_distance: actual_distance || 0,
      dispatched_at: dispatched_at ? formatMySQLDateTime(dispatched_at) : null,
      completed_at: completed_at ? formatMySQLDateTime(completed_at) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Trip creation error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/trips/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Convert ISO timestamps to MySQL format
    const bodyWithFormattedDates = { ...req.body };
    if (bodyWithFormattedDates.dispatched_at) {
      bodyWithFormattedDates.dispatched_at = formatMySQLDateTime(
        bodyWithFormattedDates.dispatched_at,
      );
    }
    if (bodyWithFormattedDates.completed_at) {
      bodyWithFormattedDates.completed_at = formatMySQLDateTime(
        bodyWithFormattedDates.completed_at,
      );
    }

    const updateFields = Object.keys(bodyWithFormattedDates)
      .filter((key) => !["id", "created_at", "updated_at"].includes(key))
      .map((key) => `${key} = ?`)
      .join(", ");

    if (!updateFields) {
      const [updated] = await pool.query("SELECT * FROM trips WHERE id = ?", [
        id,
      ]);
      return res.json(updated[0]);
    }

    const values = Object.values(bodyWithFormattedDates).filter(
      (_, i) =>
        !["id", "created_at", "updated_at"].includes(
          Object.keys(bodyWithFormattedDates)[i],
        ),
    );

    const connection = await pool.getConnection();
    await connection.query(`UPDATE trips SET ${updateFields} WHERE id = ?`, [
      ...values,
      id,
    ]);
    const [updated] = await connection.query(
      "SELECT * FROM trips WHERE id = ?",
      [id],
    );
    connection.release();

    res.json(updated[0]);
  } catch (error) {
    console.error("Trip update error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/trips/:id", verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query("DELETE FROM trips WHERE id = ?", [req.params.id]);
    connection.release();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== MAINTENANCE ROUTES ====================

app.get("/api/maintenance", verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [logs] = await connection.query("SELECT * FROM maintenance_logs");
    connection.release();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get(
  "/api/maintenance/vehicle/:vehicleId",
  verifyToken,
  async (req, res) => {
    try {
      const connection = await pool.getConnection();
      const [logs] = await connection.query(
        "SELECT * FROM maintenance_logs WHERE vehicle_id = ?",
        [req.params.vehicleId],
      );
      connection.release();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

app.get("/api/maintenance/:id", verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [logs] = await connection.query(
      "SELECT * FROM maintenance_logs WHERE id = ?",
      [req.params.id],
    );
    connection.release();

    if (logs.length === 0) {
      return res.status(404).json({ error: "Maintenance log not found" });
    }

    res.json(logs[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/maintenance", verifyToken, async (req, res) => {
  try {
    const { vehicle_id, service_type, cost, service_date, notes, status } =
      req.body;

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      "INSERT INTO maintenance_logs (vehicle_id, service_type, cost, service_date, notes, status) VALUES (?, ?, ?, ?, ?, ?)",
      [
        vehicle_id,
        service_type,
        cost,
        service_date ? formatMySQLDate(service_date) : null,
        notes || null,
        status || "Open",
      ],
    );
    connection.release();

    res.status(201).json({
      id: result.insertId,
      vehicle_id,
      service_type,
      cost,
      service_date: service_date ? formatMySQLDate(service_date) : null,
      notes: notes || null,
      status: status || "Open",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/maintenance/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Convert ISO date to MySQL format
    const bodyWithFormattedDates = { ...req.body };
    if (bodyWithFormattedDates.service_date) {
      bodyWithFormattedDates.service_date = formatMySQLDate(
        bodyWithFormattedDates.service_date,
      );
    }

    const updateFields = Object.keys(bodyWithFormattedDates)
      .filter((key) => !["id", "created_at", "updated_at"].includes(key))
      .map((key) => `${key} = ?`)
      .join(", ");

    const values = Object.values(bodyWithFormattedDates).filter(
      (_, i) =>
        !["id", "created_at", "updated_at"].includes(
          Object.keys(bodyWithFormattedDates)[i],
        ),
    );

    const connection = await pool.getConnection();

    // If no fields to update, return current record
    if (!updateFields) {
      const [updated] = await connection.query(
        "SELECT * FROM maintenance_logs WHERE id = ?",
        [id],
      );
      connection.release();
      return res.json(updated[0]);
    }

    await connection.query(
      `UPDATE maintenance_logs SET ${updateFields} WHERE id = ?`,
      [...values, id],
    );
    const [updated] = await connection.query(
      "SELECT * FROM maintenance_logs WHERE id = ?",
      [id],
    );
    connection.release();

    res.json(updated[0]);
  } catch (error) {
    console.error("Maintenance update error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/maintenance/:id", verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query("DELETE FROM maintenance_logs WHERE id = ?", [
      req.params.id,
    ]);
    connection.release();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== EXPENSES ROUTES ====================

app.get("/api/expenses", verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [expenses] = await connection.query("SELECT * FROM expenses");
    connection.release();
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/expenses/:id", verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [expenses] = await connection.query(
      "SELECT * FROM expenses WHERE id = ?",
      [req.params.id],
    );
    connection.release();

    if (expenses.length === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json(expenses[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/expenses", verifyToken, async (req, res) => {
  try {
    const {
      trip_id,
      vehicle_id,
      fuel_liters,
      fuel_cost,
      misc_cost,
      expense_date,
      notes,
    } = req.body;

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      "INSERT INTO expenses (trip_id, vehicle_id, fuel_liters, fuel_cost, misc_cost, expense_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        trip_id || null,
        vehicle_id,
        fuel_liters,
        fuel_cost,
        misc_cost,
        expense_date ? formatMySQLDate(expense_date) : null,
        notes || null,
      ],
    );
    connection.release();

    res.status(201).json({
      id: result.insertId,
      trip_id: trip_id || null,
      vehicle_id,
      fuel_liters,
      fuel_cost,
      misc_cost,
      expense_date: expense_date ? formatMySQLDate(expense_date) : null,
      notes: notes || null,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/expenses/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Convert ISO date to MySQL format
    const bodyWithFormattedDates = { ...req.body };
    if (bodyWithFormattedDates.expense_date) {
      bodyWithFormattedDates.expense_date = formatMySQLDate(
        bodyWithFormattedDates.expense_date,
      );
    }

    const updateFields = Object.keys(bodyWithFormattedDates)
      .filter((key) => !["id", "created_at"].includes(key))
      .map((key) => `${key} = ?`)
      .join(", ");

    const values = Object.values(bodyWithFormattedDates).filter(
      (_, i) =>
        !["id", "created_at"].includes(Object.keys(bodyWithFormattedDates)[i]),
    );

    const connection = await pool.getConnection();

    // If no fields to update, return current record
    if (!updateFields) {
      const [updated] = await connection.query(
        "SELECT * FROM expenses WHERE id = ?",
        [id],
      );
      connection.release();
      return res.json(updated[0]);
    }

    await connection.query(`UPDATE expenses SET ${updateFields} WHERE id = ?`, [
      ...values,
      id,
    ]);
    const [updated] = await connection.query(
      "SELECT * FROM expenses WHERE id = ?",
      [id],
    );
    connection.release();

    res.json(updated[0]);
  } catch (error) {
    console.error("Expense update error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/expenses/:id", verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query("DELETE FROM expenses WHERE id = ?", [
      req.params.id,
    ]);
    connection.release();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== HEALTH CHECK ====================

app.get("/api/health", (req, res) => {
  res.json({ status: "API is running" });
});

async function ensureTripRevenueColumn() {
  const connection = await pool.getConnection();
  try {
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM trips LIKE 'revenue'",
    );

    if (Array.isArray(columns) && columns.length === 0) {
      await connection.query(
        "ALTER TABLE trips ADD COLUMN revenue DECIMAL(12, 2) DEFAULT 0 AFTER actual_distance",
      );
      console.log("✓ Added trips.revenue column");
    }
  } finally {
    connection.release();
  }
}

async function startServer() {
  try {
    await ensureTripRevenueColumn();
    app.listen(PORT, () => {
      console.log(`✓ Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
