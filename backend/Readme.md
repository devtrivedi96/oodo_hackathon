# Backend Folder

This folder contains all server-side code for the Fleet Management System.

- **config/**: Database connection and configuration files.
- **server/**: Main server logic, including:
  - **controllers/**: Handles business logic for authentication, user management, trips, vehicles, etc.
  - **middleware/**: Express middleware for authentication, error handling, etc.
  - **routes/**: API route definitions for different resources (auth, vehicles, trips, etc.).
  - **utils/**: Utility functions (e.g., sending emails).
- **database.js**: Database connection setup.
- **schema.sql**: SQL schema for relational database (MySQL).
- **server.js**: Entry point for the backend server.

**Purpose:**
Implements all backend logic, real-time state management, and API endpoints for the digital fleet management hub.
