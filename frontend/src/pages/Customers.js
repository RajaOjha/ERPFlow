import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Customers.css";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    company_name: "",
    contact_person: "",
    mobile: "",
    email: "",
    city: "",
  });

  const token = localStorage.getItem("token");

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/customers",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCustomers(response.data.customers);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load customers"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await axios.post(
        "http://localhost:5000/api/customers",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setFormData({
        company_name: "",
        contact_person: "",
        mobile: "",
        email: "",
        city: "",
      });

      setShowForm(false);
      fetchCustomers();
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to create customer"
      );
    }
  };

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1>Customers</h1>
          <p>Manage your customer records</p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "Add Customer"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="form-card">
          <h2>Add Customer</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Company Name</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Contact Person</label>
                <input
                  type="text"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Mobile</label>
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button type="submit" className="primary-button">
              Save Customer
            </button>
          </form>
        </div>
      )}

      <div className="table-card">
        <div className="table-header">
          <h2>Customer List</h2>
          <span>{customers.length} customers</span>
        </div>

        {loading ? (
          <p className="empty-message">Loading customers...</p>
        ) : customers.length === 0 ? (
          <p className="empty-message">No customers found.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact Person</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>City</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.company_name}</td>
                    <td>{customer.contact_person}</td>
                    <td>{customer.mobile}</td>
                    <td>{customer.email || "-"}</td>
                    <td>{customer.city || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;