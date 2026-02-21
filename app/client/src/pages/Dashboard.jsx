import { useState, useEffect } from 'react';
import { authAPI } from '../api';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Get user from localStorage first for quick display
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Fetch current user data from API
    const fetchUser = async () => {
      try {
        const response = await authAPI.getCurrentUser();
        setUser(response.data.user);
      } catch (err) {
        console.error('Failed to fetch user:', err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          handleLogout();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <button onClick={handleLogout} className="btn-logout" data-testid="logout-btn">
          Logout
        </button>
      </div>

      <div className="welcome-card">
        <div className="welcome-icon">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
        <h2>Welcome, {user?.name}!</h2>
        <p className="welcome-message">You have successfully logged in to your account.</p>
        
        <div className="user-info">
          <div className="info-item">
            <label>Name:</label>
            <span>{user?.name}</span>
          </div>
          <div className="info-item">
            <label>Email:</label>
            <span>{user?.email}</span>
          </div>
          <div className="info-item">
            <label>Account Status:</label>
            <span className="verified-badge">Verified ✓</span>
          </div>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Account Active</h3>
          <p>Your account is verified and active</p>
        </div>
        <div className="stat-card">
          <h3>Secure</h3>
          <p>Protected with JWT authentication</p>
        </div>
        <div className="stat-card">
          <h3>Email Verified</h3>
          <p>Your email has been confirmed</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;