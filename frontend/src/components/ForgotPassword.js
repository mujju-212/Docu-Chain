import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    newPassword: false,
    confirmPassword: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const togglePassword = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.otp && data.dev_note) {
          setSuccess(`${data.message} Development OTP: ${data.otp}`);
          console.log('Development mode - OTP:', data.otp);
          console.log('Development note:', data.dev_note);
        } else {
          setSuccess('Reset code sent to your email!');
        }
        setStep(2);
      } else {
        // Handle different error scenarios
        if (response.status === 404) {
          setError(data.message || 'This email is not registered with DocuChain. Please check your email or sign up first.');
        } else if (response.status === 400) {
          setError(data.message || 'Invalid email address.');
        } else {
          setError(data.message || 'Failed to send reset code. Please try again.');
        }
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/verify-reset-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Code verified! Create your new password.');
        setStep(3);
      } else {
        setError(data.message || 'Invalid or expired code.');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Password validation
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(newPassword)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Password reset successfully! You can now login with your new password.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(data.message || 'Failed to reset password.');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError('Password reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shell">
      <div className="card">
        <section className="left">
          <div className="brand">
            <div className="logo">D</div>
            <div className="label">DocuChain</div>
          </div>

          {step === 1 && (
            <div className="form-scroll-container">
              <h1>Reset Password</h1>
              <p className="sub">Enter your email address and we'll send you a reset code</p>

              {error && <div className="error">{error}</div>}
              {success && <div className="success">{success}</div>}

              <form onSubmit={handleSendOtp}>
                <div className="field">
                  <i className="ri-at-line"></i>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <button className="btn primary" type="submit" disabled={loading}>
                  {loading ? (
                    <><i className="ri-loader-4-line"></i> Sending...</>
                  ) : (
                    <><i className="ri-mail-send-line"></i> Send Reset Code</>
                  )}
                </button>

                <div className="foot">
                  Remember your password? <Link to="/login" style={{color:'var(--b-700)'}}>Sign In</Link>
                </div>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="form-scroll-container">
              <h1>Enter Reset Code</h1>
              <p className="sub">We've sent a 6-digit code to {email}</p>

              {error && <div className="error">{error}</div>}
              {success && <div className="success">{success}</div>}

              <form onSubmit={handleVerifyOtp}>
                <div className="field">
                  <i className="ri-shield-keyhole-line"></i>
                  <input
                    type="text"
                    placeholder="Enter 6-digit reset code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    maxLength={6}
                    pattern="\d{6}"
                  />
                </div>

                <button className="btn primary" type="submit" disabled={loading}>
                  {loading ? (
                    <><i className="ri-loader-4-line"></i> Verifying...</>
                  ) : (
                    <><i className="ri-checkbox-circle-line"></i> Verify Code</>
                  )}
                </button>

                <div className="foot">
                  <button 
                    type="button" 
                    className="btn secondary" 
                    onClick={() => setStep(1)}
                    style={{marginRight: '10px'}}
                  >
                    <i className="ri-arrow-left-line"></i> Back
                  </button>
                  Didn't receive code? <button type="button" onClick={handleSendOtp} style={{background: 'none', border: 'none', color: 'var(--b-700)', cursor: 'pointer'}}>Resend</button>
                </div>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="form-scroll-container">
              <h1>Create New Password</h1>
              <p className="sub">Enter your new password below</p>

              {error && <div className="error">{error}</div>}
              {success && <div className="success">{success}</div>}

              <form onSubmit={handleResetPassword}>
                <div className="field">
                  <i className="ri-shield-keyhole-line" aria-hidden="true"></i>
                  <input
                    type={showPasswords.newPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    className="icon"
                    type="button"
                    onClick={() => togglePassword('newPassword')}
                    aria-label={showPasswords.newPassword ? "Hide password" : "Show password"}
                  >
                    <i className={showPasswords.newPassword ? "ri-eye-line" : "ri-eye-off-line"}></i>
                  </button>
                </div>

                <div className="field">
                  <i className="ri-shield-check-line" aria-hidden="true"></i>
                  <input
                    type={showPasswords.confirmPassword ? "text" : "password"}
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    className="icon"
                    type="button"
                    onClick={() => togglePassword('confirmPassword')}
                    aria-label={showPasswords.confirmPassword ? "Hide password" : "Show password"}
                  >
                    <i className={showPasswords.confirmPassword ? "ri-eye-line" : "ri-eye-off-line"}></i>
                  </button>
                </div>

                <div className="password-requirements">
                  <small style={{color: 'var(--muted)', fontSize: '14px'}}>
                    Password must contain at least 6 characters with uppercase, lowercase, and numbers.
                  </small>
                </div>

                <button className="btn primary" type="submit" disabled={loading}>
                  {loading ? (
                    <><i className="ri-loader-4-line"></i> Resetting...</>
                  ) : (
                    <><i className="ri-shield-check-line"></i> Reset Password</>
                  )}
                </button>

                <div className="foot">
                  <button 
                    type="button" 
                    className="btn secondary" 
                    onClick={() => setStep(2)}
                  >
                    <i className="ri-arrow-left-line"></i> Back
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>

        <section className="right" aria-hidden="true">
          {/* Same right section as Login/Register */}
          <div className="bubble"><i className="ri-check-line"></i> Secure</div>
          <div className="lock"><i className="ri-lock-2-fill"></i></div>
          <div className="cloud c1"></div>
          <div className="cloud c2"></div>
          <div className="cloud c3"></div>
          <div className="cloud c4"></div>

          <svg className="phone" viewBox="0 0 420 560" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Secure password reset">
            <defs>
              <linearGradient id="screenGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#c7ffe9"/>
                <stop offset="50%" stopColor="#8ae2be"/>
                <stop offset="100%" stopColor="#19a571"/>
              </linearGradient>
              <linearGradient id="bodyGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#0b2330"/>
                <stop offset="100%" stopColor="#12343b"/>
              </linearGradient>
              <filter id="innerShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feOffset dx="0" dy="-6"/>
                <feGaussianBlur stdDeviation="10" result="b"/>
                <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1"/>
                <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .35 0"/>
                <feBlend in2="SourceGraphic"/>
              </filter>
            </defs>

            <g transform="translate(30,20)">
              <rect rx="36" ry="36" width="360" height="520" fill="url(#bodyGrad)"/>
              <rect x="14" y="16" rx="28" ry="28" width="332" height="488" fill="url(#screenGrad)" filter="url(#innerShadow)"/>
              <rect x="160" y="6" width="40" height="10" rx="5" fill="#0b1a1f" opacity="0.85"/>

              <g transform="translate(180,260)" fill="none" stroke="#0f4031" strokeWidth="4" opacity="0.55">
                <circle r="18"/>
                <circle r="34" opacity="0.45"/>
                <circle r="50" opacity="0.35"/>
              </g>
              <rect x="90" y="360" width="180" height="10" rx="5" fill="#0f4031" opacity=".35"/>
              <rect x="90" y="360" width="108" height="10" rx="5" fill="#0f4031"/>
              <g transform="translate(298,66)" fill="none" stroke="#0f4031" strokeWidth="4">
                <circle cx="0" cy="0" r="10"/>
                <path d="M0 -15V-22M0 15V22M-15 0H-22M15 0H22M-11 -11L-16 -16M11 11L16 16M-11 11L-16 16M11 -11L16 -16"/>
              </g>
            </g>
          </svg>
        </section>
      </div>
    </div>
  );
}