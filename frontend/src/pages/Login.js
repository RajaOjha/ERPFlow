
import React, { useState } from "react";
import axios from "axios";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDemoPopup, setShowDemoPopup] = useState(true);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password }
      );

      localStorage.setItem("token", response.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      window.location.href = "/dashboard";
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const selectDemoAccount = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setShowDemoPopup(false);
  };

  return (
    <div className="login-page">
      {showDemoPopup && (
        <div className="demo-overlay">
          <div
            className="demo-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-title"
          >
            <div className="demo-brand-icon">E</div>

            <p className="demo-eyebrow">WELCOME TO ERPFlow</p>
            <h2 id="demo-title">Explore the demo accounts</h2>
            <p className="demo-description">
              Choose a role to explore the business workflow.
              Use the corresponding demo password configured
              for your local backend.
            </p>

            <div className="demo-account admin-account">
              <div className="demo-account-top">
                <span className="demo-role-icon">A</span>
                <div>
                  <h3>Administrator</h3>
                  <p>Full workflow access</p>
                </div>
              </div>

              <label>Demo email</label>
              <div className="demo-email">
                admin@erpflow.com
              </div>

              <p className="demo-password-note">
                Password: <strong>Admin@123</strong>
              </p>

              <button
                type="button"
                className="demo-select-button"
                onClick={() => selectDemoAccount("admin@erpflow.com", "Admin@123")}
              >
                Use Admin Account
              </button>
            </div>

            <div className="demo-account sales-account">
              <div className="demo-account-top">
                <span className="demo-role-icon">S</span>
                <div>
                  <h3>Sales User</h3>
                  <p>Customer and sales workflow</p>
                </div>
              </div>

              <label>Demo email</label>
              <div className="demo-email">
                sales@erpflow.com
              </div>

              <p className="demo-password-note">
                Password: <strong>Sales@123</strong>
              </p>

              <button
                type="button"
                className="demo-select-button sales-select-button"
                onClick={() => selectDemoAccount("sales@erpflow.com", "Sales@123")}
              >
                Use Sales Account
              </button>
            </div>

            <button
              type="button"
              className="demo-continue-button"
              onClick={() => setShowDemoPopup(false)}
            >
              Continue to Login
            </button>

            <p className="demo-security-note">
              Demo passwords are not displayed in the public application.
            </p>
          </div>
        </div>
      )}

      <div className="login-container">
        <div className="login-left">
          <div className="brand">
            <div className="brand-icon">E</div>
            <h1>ERPFlow</h1>
          </div>

          <span className="login-kicker">BUSINESS OPERATIONS PLATFORM</span>

          <h2>One workflow.<br />Complete control.</h2>

          <p>
            From customer enquiries to quotations, sales orders,
            inventory reservations and dispatch, manage your
            business operations in one place.
          </p>

          <div className="workflow">
            <span>Enquiry</span>
            <span className="workflow-arrow">→</span>
            <span>Quotation</span>
            <span className="workflow-arrow">→</span>
            <span>Sales Order</span>
            <span className="workflow-arrow">→</span>
            <span>Dispatch</span>
          </div>

          <div className="login-left-footer">
            <span className="status-dot"></span>
            A connected business workflow
          </div>
        </div>

        <div className="login-right">
          <div className="login-card">
            <p className="form-eyebrow">YOUR WORKSPACE</p>
            <h2>Welcome back</h2>

            <p className="login-subtitle">
              Sign in to continue to ERPFlow
            </p>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="username"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>

              {error && (
                <div className="error-message" role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
                {!loading && <span aria-hidden="true">→</span>}
              </button>
            </form>

            <button
              type="button"
              className="reopen-demo-button"
              onClick={() => setShowDemoPopup(true)}
            >
              View demo account details
            </button>

            <p className="login-footer">
              ERPFlow <span>·</span> Business Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
