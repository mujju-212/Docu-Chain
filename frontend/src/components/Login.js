import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../services/api';
import '../pages/auth/auth.css';
import '../pages/auth/auth.mobile.css';

function Login() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    institutionId: '',
    remember: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Institution dropdown state
  const [institutions, setInstitutions] = useState([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const navigate = useNavigate();

  // Add auth-page class to body for proper styling isolation
  useEffect(() => {
    document.body.classList.add('auth-page');
    return () => {
      document.body.classList.remove('auth-page');
    };
  }, []);

  useEffect(() => {
    // Load saved email if remember me was checked
    const savedEmail = localStorage.getItem('docuchain_email');
    const rememberMe = localStorage.getItem('docuchain_remember') === 'true';
    
    if (savedEmail && rememberMe) {
      setFormData(prev => ({
        ...prev,
        email: savedEmail,
        remember: true
      }));
    }
    
    // Fetch institutions on component mount
    fetchInstitutions();
  }, []);

  // Fetch institutions from API with retry logic
  const fetchInstitutions = async (retryCount = 0) => {
    const maxRetries = 3;
    
    try {
      setLoadingInstitutions(true);
      
      const response = await fetch(`${API_URL}/institutions/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.institutions && data.institutions.length > 0) {
          setInstitutions(data.institutions);
          setLoadingInstitutions(false); // Set loading to false on success
          return; // Success, exit function
        }
      }
      
      // If we get here, there was an issue
      if (retryCount < maxRetries) {
        setTimeout(() => fetchInstitutions(retryCount + 1), 2000);
        return;
      } else {
        setInstitutions([]);
      }
      
    } catch (error) {
      if (retryCount < maxRetries) {
        setTimeout(() => fetchInstitutions(retryCount + 1), 2000);
        return;
      } else {
        setInstitutions([]);
      }
    } finally {
      if (retryCount >= maxRetries) {
        setLoadingInstitutions(false);
      }
    }
  };

  const validateForm = () => {
    // Standard email validation regex
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    
    if (!formData.institutionId) {
      setError('Please select an institution.');
      return false;
    }
    
    if (!emailRegex.test(String(formData.email).toLowerCase())) {
      setError('Invalid email format. Please enter a valid email.');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Simulate API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 900));
      
      // Handle remember me
      if (formData.remember) {
        localStorage.setItem('docuchain_email', formData.email);
        localStorage.setItem('docuchain_remember', 'true');
      } else {
        localStorage.removeItem('docuchain_email');
        localStorage.removeItem('docuchain_remember');
      }
      
      // Use AuthContext login with institution
      const success = await login(formData.email, formData.password, formData.institutionId, formData.remember);
      
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid credentials or institution access denied');
      }
      
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (error) setError('');
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="shell">
      <div className="card">
        {/* Left: form */}
        <section className="left">
          <div className="brand">
            <div className="logo">D</div>
            <div className="name">DocuChain</div>
          </div>

          <h1>Hello, Welcome Back</h1>
          <p className="sub">Hey, welcome back to your special place.</p>

          <div className={`error ${error ? 'show' : ''}`} id="errorBox">
            <i className="ri-error-warning-line"></i> {error}
          </div>

          <form id="loginForm" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <i className="ri-school-line" aria-hidden="true"></i>
              <select
                id="institutionId"
                name="institutionId"
                value={formData.institutionId}
                onChange={handleInputChange}
                required
                disabled={loadingInstitutions}
              >
                <option value="">
                  {loadingInstitutions ? 'Loading institutions...' : 'Select Institution'}
                </option>
                {institutions.map((institution) => (
                  <option key={institution.id} value={institution.id}>
                    {institution.name} ({institution.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <i className="ri-at-line" aria-hidden="true"></i>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="stanley@gmail.com"
                value={formData.email}
                onChange={handleInputChange}
                autoComplete="username"
                required
              />
            </div>

            <div className="field">
              <i className="ri-shield-keyhole-line" aria-hidden="true"></i>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••"
                value={formData.password}
                onChange={handleInputChange}
                autoComplete="current-password"
                required
                minLength="6"
              />
              <button
                className="icon"
                type="button"
                id="togglePwd"
                onClick={togglePassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <i className={showPassword ? "ri-eye-line" : "ri-eye-off-line"}></i>
              </button>
            </div>

            <div className="row">
              <label>
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={formData.remember}
                  onChange={handleInputChange}
                />
                Remember me
              </label>
              <Link to="/forgot-password" aria-label="Forgot password">Forgot Password?</Link>
            </div>

            <button className="btn primary" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <i className="ri-loader-4-line ri-spin"></i> Signing in...
                </>
              ) : (
                <>
                  <i className="ri-door-open-line"></i> Sign In
                </>
              )}
            </button>

            <p className="hint">Use your email and password to sign in to your account.</p>
          </form>

          <p className="foot">Don't have an account? <Link to="/register">Sign Up</Link></p>
        </section>

        {/* Right: illustration */}
        <section className="right" aria-hidden="true">
          {/* Floating elements */}
          <div className="bubble"><i className="ri-check-line"></i> Verified</div>
          <div className="lock"><i className="ri-lock-2-fill"></i></div>
          <div className="cloud c1"></div>
          <div className="cloud c2"></div>
          <div className="cloud c3"></div>
          <div className="cloud c4"></div>

          {/* Stylized phone with fingerprint (inline SVG) */}
          <svg className="phone" viewBox="0 0 420 560" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Secure phone">
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

            {/* Phone body */}
            <g transform="translate(30,20)">
              <rect rx="36" ry="36" width="360" height="520" fill="url(#bodyGrad)"/>
              <rect x="14" y="16" rx="28" ry="28" width="332" height="488" fill="url(#screenGrad)" filter="url(#innerShadow)"/>
              {/* Camera punch */}
              <rect x="160" y="6" width="40" height="10" rx="5" fill="#0b1a1f" opacity="0.85"/>

              {/* Fingerprint rings */}
              <g transform="translate(180,260)" fill="none" stroke="#0f4031" strokeWidth="4" opacity="0.55">
                <circle r="18"/>
                <circle r="34" opacity="0.45"/>
                <circle r="50" opacity="0.35"/>
              </g>
              {/* Progress bar */}
              <rect x="90" y="360" width="180" height="10" rx="5" fill="#0f4031" opacity=".35"/>
              <rect x="90" y="360" width="108" height="10" rx="5" fill="#0f4031"/>
              {/* Small gear icon */}
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

export default Login;