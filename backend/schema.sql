-- Create FleetFlow Database Schema
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role ENUM('Manager', 'Dispatcher', 'Safety Officer', 'Analyst') DEFAULT 'Analyst',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vehicles (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  license_plate VARCHAR(50) UNIQUE NOT NULL,
  max_load_capacity DECIMAL(10, 2) NOT NULL,
  odometer INT DEFAULT 0,
  acquisition_cost DECIMAL(12, 2) NOT NULL,
  status ENUM('Available', 'On Trip', 'In Shop', 'Retired') DEFAULT 'Available',
  vehicle_type VARCHAR(100),
  region VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_region (region)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS drivers (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  license_number VARCHAR(50) UNIQUE NOT NULL,
  license_category VARCHAR(10),
  license_expiry DATE NOT NULL,
  status ENUM('On Duty', 'Off Duty', 'Suspended') DEFAULT 'Off Duty',
  completion_rate DECIMAL(5, 2) DEFAULT 0,
  safety_score DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_license_expiry (license_expiry)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS trips (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  vehicle_id VARCHAR(36) NOT NULL,
  driver_id VARCHAR(36) NOT NULL,
  cargo_weight DECIMAL(10, 2) NOT NULL,
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  estimated_distance DECIMAL(10, 2) NOT NULL,
  actual_distance DECIMAL(10, 2),
  status ENUM('Draft', 'Dispatched', 'Completed', 'Cancelled') DEFAULT 'Draft',
  dispatched_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE RESTRICT,
  INDEX idx_vehicle_id (vehicle_id),
  INDEX idx_driver_id (driver_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  vehicle_id VARCHAR(36) NOT NULL,
  service_type VARCHAR(255) NOT NULL,
  cost DECIMAL(10, 2) NOT NULL,
  service_date DATE NOT NULL,
  notes TEXT,
  status ENUM('Open', 'Closed') DEFAULT 'Open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  INDEX idx_vehicle_id (vehicle_id),
  INDEX idx_status (status),
  INDEX idx_service_date (service_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  trip_id VARCHAR(36),
  vehicle_id VARCHAR(36) NOT NULL,
  fuel_liters DECIMAL(10, 2) NOT NULL,
  fuel_cost DECIMAL(10, 2) NOT NULL,
  misc_cost DECIMAL(10, 2) DEFAULT 0,
  expense_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  INDEX idx_vehicle_id (vehicle_id),
  INDEX idx_trip_id (trip_id),
  INDEX idx_expense_date (expense_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
