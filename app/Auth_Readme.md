# Authentication System with OTP Email Verification

Complete Login + Registration system with email OTP verification using Node.js, Express, MySQL, and React.

## Features

- User Registration with email validation
- 6-digit OTP email verification via Brevo API
- Secure login with JWT authentication
- Password hashing with bcrypt
- Protected dashboard route
- Modern, professional UI
- Complete error handling

## Tech Stack

### Backend
- Node.js
- Express.js
- MySQL (MariaDB)
- JWT for authentication
- bcrypt for password hashing
- Axios for Brevo API integration

### Frontend
- React 18
- Vite
- React Router v6
- Axios for API calls
- Modern CSS

## Prerequisites

- Node.js (v14 or higher)
- MySQL/MariaDB
- Brevo (Sendinblue) account for email API

## Project Structure

```
root/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Register.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── VerifyOtp.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── api.js
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                 # Express backend
│   ├── controllers/
│   │   └── authController.js
│   ├── routes/
│   │   └── authRoutes.js
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── utils/
│   │   └── sendEmail.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
└── README.md
```

## Installation & Setup

### Step 1: Database Setup

1. Start MySQL/MariaDB service:
```bash
sudo /etc/init.d/mariadb start
```

2. Create database and user:
```bash
sudo mysql -e "CREATE DATABASE IF NOT EXISTS auth_system;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'authuser'@'localhost' IDENTIFIED BY 'authpass123';"
sudo mysql -e "GRANT ALL PRIVILEGES ON auth_system.* TO 'authuser'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

3. Create users table:
```sql
USE auth_system;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  otp VARCHAR(10),
  otp_expiry DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Step 2: Get Brevo API Key

1. Go to [Brevo](https://www.brevo.com/) (formerly Sendinblue)
2. Create a free account
3. Navigate to: **Settings** → **SMTP & API** → **API Keys**
4. Create a new API key
5. Copy the API key for the next step

**Important:** You also need to verify a sender email in Brevo:
- Go to **Senders** → **Add a new sender**
- Add and verify your sender email address
- Update the sender email in `/app/server/utils/sendEmail.js`

### Step 3: Backend Setup

1. Navigate to server directory:
```bash
cd /app/server
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`:
```env
PORT=5000
DB_HOST=localhost
DB_USER=authuser
DB_PASSWORD=authpass123
DB_NAME=auth_system
JWT_SECRET=your_jwt_secret_key_change_this_in_production_12345
BREVO_API_KEY=your_actual_brevo_api_key_here
```

**Replace `your_actual_brevo_api_key_here` with your real Brevo API key!**

4. Update sender email in `/app/server/utils/sendEmail.js`:
```javascript
sender: {
  name: 'Your App Name',
  email: 'your-verified-email@yourdomain.com'  // Must be verified in Brevo
}
```

5. Start the backend server:
```bash
npm start
```

Server will run on `http://localhost:5000`

### Step 4: Frontend Setup

1. Navigate to client directory:
```bash
cd /app/client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Client will run on `http://localhost:3000`

## Usage Flow

### 1. Registration
- User fills in name, email, and password
- Backend validates input
- Password is hashed with bcrypt
- 6-digit OTP is generated
- OTP is stored with 5-minute expiry
- Email is sent via Brevo API
- User is redirected to OTP verification page

### 2. OTP Verification
- User enters the 6-digit OTP from email
- Backend validates OTP and checks expiry
- If valid, user is marked as verified
- OTP is cleared from database
- User is redirected to login page

### 3. Login
- User enters email and password
- Backend checks if email is verified
- Password is compared with hashed version
- JWT token is generated and returned
- Token is stored in localStorage
- User is redirected to dashboard

### 4. Dashboard (Protected Route)
- JWT token is sent with request
- Backend verifies token
- User data is fetched and displayed
- Logout clears token and redirects to login

## API Endpoints

### Public Routes

**POST** `/api/auth/register`
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**POST** `/api/auth/verify-otp`
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**POST** `/api/auth/login`
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Protected Routes

**GET** `/api/auth/me`
Headers:
```
Authorization: Bearer <jwt_token>
```

**GET** `/api/health`
- Health check endpoint

## Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT token authentication
- OTP expiry (5 minutes)
- Email uniqueness validation
- Input validation
- Protected routes with middleware
- CORS enabled
- Environment variables for secrets

## Testing

### Test Registration Flow
1. Open `http://localhost:3000/register`
2. Fill in the registration form
3. Check your email for OTP (check spam folder)
4. Enter OTP on verification page
5. Login with credentials
6. Access dashboard

### Test API with cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123"}'

# Verify OTP (use OTP from email)
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

## Troubleshooting

### Email Not Sending
- Verify Brevo API key is correct
- Check sender email is verified in Brevo
- Check Brevo API usage limits (free tier: 300 emails/day)
- Check server logs for email errors

### Database Connection Issues
- Ensure MySQL/MariaDB is running
- Verify database credentials in `.env`
- Check if user has proper permissions

### Frontend API Errors
- Ensure backend server is running on port 5000
- Check CORS configuration
- Verify API URL in `/app/client/src/api.js`

### OTP Expiry
- OTP is valid for 5 minutes only
- If expired, register again to get new OTP

## Production Deployment

### Environment Variables to Change:
1. Generate strong `JWT_SECRET`
2. Use production database credentials
3. Update CORS origin to production URL
4. Use production Brevo API key
5. Update sender email to production domain

### Security Enhancements:
- Enable HTTPS
- Add rate limiting
- Implement refresh tokens
- Add password strength requirements
- Add forgot password flow
- Enable 2FA
- Add email resend functionality
- Implement account lockout after failed attempts

## License

MIT

## Support

For issues or questions, please contact support or create an issue in the repository.