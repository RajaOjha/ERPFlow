import React, { useState } from "react";
import axios from "axios";
import "./Login.css";

const Login = () => {
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password,
        }
      );

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

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

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-left">
          <div className="brand">
            <div className="brand-icon">E</div>
            <h1>ERPFlow</h1>
          </div>

          <h2>Manage your business workflow</h2>

          <p>
            From customer enquiries to quotations, sales orders,
            inventory and dispatch, manage everything in one place.
          </p>

          <div className="workflow">
            <span>Enquiry</span>
            <span>→</span>
            <span>Quotation</span>
            <span>→</span>
            <span>Sales Order</span>
            <span>→</span>
            <span>Dispatch</span>
          </div>
        </div>

        <div className="login-right">
          <div className="login-card">
            <h2>Welcome back</h2>

            <p className="login-subtitle">
              Sign in to your ERPFlow account
            </p>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email Address</label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="login-footer">
              ERPFlow - Business Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;