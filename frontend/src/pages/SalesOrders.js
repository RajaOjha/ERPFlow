import React, { useEffect, useState } from "react";
import axios from "axios";
import "./SalesOrders.css";

const SalesOrders = () => {
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchSalesOrders = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/sales-orders",
        authConfig
      );

      setSalesOrders(response.data.sales_orders);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to load sales orders"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesOrders();
  }, []);

  const confirmSalesOrder = async (id) => {
    setError("");
    setSuccess("");

    try {
      await axios.post(
        `http://localhost:5000/api/sales-orders/${id}/confirm`,
        {},
        authConfig
      );

      setSuccess(
        "Sales Order confirmed and inventory reserved successfully."
      );

      fetchSalesOrders();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to confirm Sales Order"
      );
    }
  };

  const cancelSalesOrder = async (id) => {
    setError("");
    setSuccess("");

    try {
      await axios.post(
        `http://localhost:5000/api/sales-orders/${id}/cancel`,
        {},
        authConfig
      );

      setSuccess("Sales Order cancelled successfully.");

      fetchSalesOrders();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to cancel Sales Order"
      );
    }
  };

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1>Sales Orders</h1>
          <p>Manage sales orders and inventory reservations</p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      <div className="table-card">
        <div className="table-header">
          <h2>Sales Order List</h2>
          <span>{salesOrders.length} orders</span>
        </div>

        {loading ? (
          <p className="empty-message">
            Loading sales orders...
          </p>
        ) : salesOrders.length === 0 ? (
          <p className="empty-message">
            No sales orders found.
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order No.</th>
                  <th>Quotation</th>
                  <th>Company</th>
                  <th>Order Date</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {salesOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.order_number}</td>

                    <td>{order.quotation_number}</td>

                    <td>{order.company_name}</td>

                    <td>{order.order_date}</td>

                    <td>
                      ₹
                      {Number(order.total_amount).toFixed(2)}
                    </td>

                    <td>
                      <span
                        className={`status ${order.status.toLowerCase()}`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td>
                      {order.status === "PENDING" &&
                        user?.role === "ADMIN" && (
                          <div className="action-buttons">
                            <button
                              className="small-button"
                              onClick={() =>
                                confirmSalesOrder(order.id)
                              }
                            >
                              Confirm Order
                            </button>

                            <button
                              className="small-button cancel-button"
                              onClick={() =>
                                cancelSalesOrder(order.id)
                              }
                            >
                              Cancel Order
                            </button>
                          </div>
                        )}

                      {order.status === "PENDING" &&
                        user?.role !== "ADMIN" && (
                          <span className="role-note">
                            Admin approval required
                          </span>
                        )}

                      {order.status === "CONFIRMED" &&
                        user?.role === "ADMIN" && (
                          <div className="action-buttons">
                            <span className="confirmed-note">
                              Inventory reserved
                            </span>

                            <button
                              className="small-button cancel-button"
                              onClick={() =>
                                cancelSalesOrder(order.id)
                              }
                            >
                              Cancel Order
                            </button>
                          </div>
                        )}

                      {order.status === "CONFIRMED" &&
                        user?.role !== "ADMIN" && (
                          <span className="confirmed-note">
                            Inventory reserved
                          </span>
                        )}

                      {order.status === "DISPATCHED" && (
                        <span className="confirmed-note">
                          Dispatched
                        </span>
                      )}

                      {order.status === "CANCELLED" && (
                        <span className="confirmed-note">
                          Cancelled
                        </span>
                      )}
                    </td>
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

export default SalesOrders;