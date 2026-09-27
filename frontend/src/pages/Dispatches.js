import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Dispatches.css";

const Dispatches = () => {
  const [orders, setOrders] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [form, setForm] = useState({
    dispatch_number: "",
    dispatch_date: new Date().toISOString().split("T")[0],
    vehicle_number: "",
    driver_name: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const fetchData = async () => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [ordersResponse, dispatchesResponse] = await Promise.all([
        axios.get("http://localhost:5000/api/sales-orders", { headers }),
        axios.get("http://localhost:5000/api/dispatches", { headers }),
      ]);

      const ordersData =
        ordersResponse.data.sales_orders || ordersResponse.data;
        
      const dispatchesData =
        dispatchesResponse.data.dispatches ||
        dispatchesResponse.data;

      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setDispatches(
        Array.isArray(dispatchesData) ? dispatchesData : []
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to load dispatch information."
      );
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOrderChange = (e) => {
    const orderId = e.target.value;

    if (!orderId) {
      setSelectedOrder(null);
      return;
    }

    const order = orders.find((item) => item.id === orderId);
    setSelectedOrder(order || null);
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleDispatch = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedOrder) {
      setError("Please select a confirmed sales order.");
      return;
    }

    if (!form.dispatch_number.trim()) {
      setError("Dispatch number is required.");
      return;
    }

    if (!form.vehicle_number.trim()) {
      setError("Vehicle number is required.");
      return;
    }

    if (!form.driver_name.trim()) {
      setError("Driver name is required.");
      return;
    }

    if (!selectedOrder.items || selectedOrder.items.length === 0) {
      setError("No order items are available for this sales order.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/dispatches",
        {
          dispatch_number: form.dispatch_number,
          sales_order_id: selectedOrder.id,
          dispatch_date: form.dispatch_date,
          vehicle_number: form.vehicle_number,
          driver_name: form.driver_name,
          items: selectedOrder.items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        response.data.message || "Dispatch created successfully."
      );

      setForm({
        dispatch_number: "",
        dispatch_date: new Date().toISOString().split("T")[0],
        vehicle_number: "",
        driver_name: "",
      });

      setSelectedOrder(null);

      await fetchData();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to process dispatch."
      );
    } finally {
      setLoading(false);
    }
  };

  const confirmedOrders = orders.filter(
    (order) => order.status === "CONFIRMED"
  );

  return (
    <div className="dispatch-page">
      <div className="dispatch-header">
        <div>
          <h1>Dispatches</h1>
          <p>Process dispatches for confirmed sales orders</p>
        </div>
      </div>

      {error && <div className="dispatch-message error">{error}</div>}

      {success && (
        <div className="dispatch-message success">{success}</div>
      )}

      <div className="dispatch-grid">
        <div className="dispatch-card">
          <div className="card-header">
            <h2>Create Dispatch</h2>
          </div>

          <form onSubmit={handleDispatch} className="dispatch-form">
            <div className="form-group">
              <label>Sales Order</label>

              <select
                value={selectedOrder?.id || ""}
                onChange={handleOrderChange}
                required
              >
                <option value="">Select confirmed order</option>

                {confirmedOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.order_number} - {order.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Dispatch Number</label>
                <input
                  type="text"
                  name="dispatch_number"
                  value={form.dispatch_number}
                  onChange={handleChange}
                  placeholder="DSP-001"
                  required
                />
              </div>

              <div className="form-group">
                <label>Dispatch Date</label>
                <input
                  type="date"
                  name="dispatch_date"
                  value={form.dispatch_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Vehicle Number</label>
                <input
                  type="text"
                  name="vehicle_number"
                  value={form.vehicle_number}
                  onChange={handleChange}
                  placeholder="MP07AB1234"
                  required
                />
              </div>

              <div className="form-group">
                <label>Driver Name</label>
                <input
                  type="text"
                  name="driver_name"
                  value={form.driver_name}
                  onChange={handleChange}
                  placeholder="Driver name"
                  required
                />
              </div>
            </div>

            {selectedOrder && (
              <div className="order-summary">
                <h3>Order Items</h3>

                {selectedOrder.items &&
                selectedOrder.items.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id || item.product_id}>
                          <td>
                            {item.product_name ||
                              item.name ||
                              item.product_code ||
                              "Product"}
                          </td>
                          <td>{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No items found for this order.</p>
                )}
              </div>
            )}

            <button
              type="submit"
              className="dispatch-button"
              disabled={loading}
            >
              {loading ? "Processing..." : "Process Dispatch"}
            </button>
          </form>
        </div>

        <div className="dispatch-card">
          <div className="card-header">
            <h2>Dispatch History</h2>
            <span>{dispatches.length} dispatches</span>
          </div>

          <div className="table-wrapper">
            <table className="dispatch-table">
              <thead>
                <tr>
                  <th>Dispatch No.</th>
                  <th>Sales Order</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {dispatches.map((dispatch) => (
                  <tr key={dispatch.id}>
                    <td>{dispatch.dispatch_number}</td>
                    <td>{dispatch.order_number}</td>
                    <td>{dispatch.vehicle_number}</td>
                    <td>{dispatch.driver_name}</td>
                    <td>
                      {dispatch.dispatch_date
                        ? new Date(
                            dispatch.dispatch_date
                          ).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ))}

                {dispatches.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      No dispatches found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dispatches;