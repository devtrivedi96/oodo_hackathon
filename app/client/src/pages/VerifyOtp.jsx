import { useState, useEffect } from 'react';
import { authAPI } from '../api';
import { useNavigate, useLocation } from 'react-router-dom';

function VerifyOtp() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.verifyOTP({ email, otp });
      alert(response.data.message);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Verify Your Email</h1>
          <p>Enter the 6-digit code sent to</p>
          <p className="email-display">{email}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="otp">OTP Code</label>
            <input
              type="text"
              id="otp"
              name="otp"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value);
                setError('');
              }}
              placeholder="Enter 6-digit OTP"
              maxLength="6"
              pattern="[0-9]{6}"
              required
              className="otp-input"
              data-testid="verify-otp-input"
            />
          </div>

          <div className="otp-info">
            <p>Code expires in 5 minutes</p>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading || otp.length !== 6}
            data-testid="verify-otp-submit-btn"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Didn't receive the code? <a href="/register">Register again</a></p>
        </div>
      </div>
    </div>
  );
}

export default VerifyOtp;