import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import axios from "axios";

const Dashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [stats, setStats] = useState({
  enquiries: 0,
  quotations: 0,
  sales_orders: 0,
  dispatches: 0
});

useEffect(() => {
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        "http://localhost:5000/api/dashboard",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

        setStats(response.data);
        } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
        }
    };

    fetchStats();
    }, []);

 const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  window.location.href = "/login";
};

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">E</div>
          <h2>ERPFlow</h2>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item active">
            Dashboard
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/customers")}
>
            Customers
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/enquiries")}
            >
            Enquiries
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/quotations")}
            >
            Quotations
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/sales-orders")}
            >
            Sales Orders
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/inventory")}
            >
            Inventory
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/dispatches")}
            >
            Dispatches
          </button>
        </nav>

        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome to ERPFlow</p>
          </div>

          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>

            <div>
              <strong>{user?.name || "User"}</strong>
              <span>{user?.role || "USER"}</span>
            </div>
          </div>
        </header>

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              EN
            </div>

            <div>
              <p>Total Enquiries</p>
              <h2>{stats.enquiries}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">
              QT
            </div>

            <div>
              <p>Quotations</p>
              <h2>{stats.quotations}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              SO
            </div>

            <div>
              <p>Sales Orders</p>
              <h2>{stats.sales_orders}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              DS
            </div>

            <div>
              <p>Dispatches</p>
              <h2>{stats.dispatches}</h2>
            </div>
          </div>
        </section>

        <section className="workflow-section">
          <div className="section-header">
            <h2>Business Workflow</h2>
            <p>Track the complete order processing workflow</p>
          </div>

          <div className="workflow-cards">
            <div className="workflow-card">
              <div className="workflow-number">01</div>
              <h3>Customer Enquiry</h3>
              <p>
                Create and manage customer enquiries.
              </p>
            </div>

            <div className="workflow-arrow">→</div>

            <div className="workflow-card">
              <div className="workflow-number">02</div>
              <h3>Quotation</h3>
              <p>
                Prepare quotations with pricing and GST.
              </p>
            </div>

            <div className="workflow-arrow">→</div>

            <div className="workflow-card">
              <div className="workflow-number">03</div>
              <h3>Sales Order</h3>
              <p>
                Convert accepted quotations into orders.
              </p>
            </div>

            <div className="workflow-arrow">→</div>

            <div className="workflow-card">
              <div className="workflow-number">04</div>
              <h3>Dispatch</h3>
              <p>
                Reserve inventory and process dispatch.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;