import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Inventory.css";

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        "http://localhost:5000/api/products/inventory",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setInventory(response.data.inventory || response.data);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to load inventory."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <div>
          <h1>Inventory</h1>
          <p>View physical, reserved and available stock</p>
        </div>

        <button
          className="refresh-button"
          onClick={fetchInventory}
        >
          Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-message">Loading inventory...</div>
      ) : (
        <div className="inventory-card">
          <div className="inventory-card-header">
            <h2>Inventory List</h2>
            <span>{inventory.length} products</span>
          </div>

          <div className="table-wrapper">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Product Code</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Physical Qty</th>
                  <th>Reserved Qty</th>
                  <th>Available Qty</th>
                </tr>
              </thead>

              <tbody>
                {inventory.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product_code}</td>
                    <td>{item.product_name}</td>
                    <td>{item.category}</td>
                    <td>{item.physical_quantity}</td>
                    <td>{item.reserved_quantity}</td>
                    <td>
                      <span className="available-badge">
                        {item.available_quantity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;