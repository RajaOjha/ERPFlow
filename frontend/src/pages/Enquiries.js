import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Enquiries.css";

const Enquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    enquiry_number: "",
    customer_id: "",
    enquiry_date: "",
    required_date: "",
    notes: "",
  });

  const [items, setItems] = useState([
    {
      product_id: "",
      quantity: 1,
    },
  ]);

  const token = localStorage.getItem("token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchEnquiries = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/enquiries",
        authConfig
      );

      setEnquiries(response.data.enquiries);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load enquiries"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/customers",
        authConfig
      );

      setCustomers(response.data.customers);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load customers"
      );
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/products",
        authConfig
      );

      setProducts(response.data.products);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load products"
      );
    }
  };

  useEffect(() => {
    fetchEnquiries();
    fetchCustomers();
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];

    updatedItems[index][field] = value;

    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        product_id: "",
        quantity: 1,
      },
    ]);
  };

  const removeItem = (index) => {
    if (items.length === 1) {
      return;
    }

    const updatedItems = items.filter(
      (_, itemIndex) => itemIndex !== index
    );

    setItems(updatedItems);
  };

  const resetForm = () => {
    setFormData({
      enquiry_number: "",
      customer_id: "",
      enquiry_date: "",
      required_date: "",
      notes: "",
    });

    setItems([
      {
        product_id: "",
        quantity: 1,
      },
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await axios.post(
        "http://localhost:5000/api/enquiries",
        {
          ...formData,
          items,
        },
        authConfig
      );

      resetForm();
      setShowForm(false);
      fetchEnquiries();
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to create enquiry"
      );
    }
  };

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1>Enquiries</h1>
          <p>Create and manage customer enquiries</p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "New Enquiry"}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {showForm && (
        <div className="form-card">
          <h2>Create Enquiry</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Enquiry Number</label>

                <input
                  type="text"
                  name="enquiry_number"
                  value={formData.enquiry_number}
                  onChange={handleChange}
                  placeholder="ENQ-002"
                  required
                />
              </div>

              <div className="form-group">
                <label>Customer</label>

                <select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select Customer
                  </option>

                  {customers.map((customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.company_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Enquiry Date</label>

                <input
                  type="date"
                  name="enquiry_date"
                  value={formData.enquiry_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Required Date</label>

                <input
                  type="date"
                  name="required_date"
                  value={formData.required_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Notes</label>

                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Enter enquiry notes"
                />
              </div>
            </div>

            <div className="items-section">
              <div className="items-header">
                <h3>Products</h3>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={addItem}
                >
                  Add Product
                </button>
              </div>

              {items.map((item, index) => (
                <div className="item-row" key={index}>
                  <div className="form-group product-field">
                    <label>Product</label>

                    <select
                      value={item.product_id}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "product_id",
                          e.target.value
                        )
                      }
                      required
                    >
                      <option value="">
                        Select Product
                      </option>

                      {products.map((product) => (
                        <option
                          key={product.id}
                          value={product.id}
                        >
                          {product.product_code} -{" "}
                          {product.product_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group quantity-field">
                    <label>Quantity</label>

                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "quantity",
                          Number(e.target.value)
                        )
                      }
                      required
                    />
                  </div>

                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="primary-button"
            >
              Create Enquiry
            </button>
          </form>
        </div>
      )}

      <div className="table-card">
        <div className="table-header">
          <h2>Enquiry List</h2>
          <span>{enquiries.length} enquiries</span>
        </div>

        {loading ? (
          <p className="empty-message">
            Loading enquiries...
          </p>
        ) : enquiries.length === 0 ? (
          <p className="empty-message">
            No enquiries found.
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Enquiry No.</th>
                  <th>Company</th>
                  <th>Contact Person</th>
                  <th>Enquiry Date</th>
                  <th>Required Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {enquiries.map((enquiry) => (
                  <tr key={enquiry.id}>
                    <td>{enquiry.enquiry_number}</td>
                    <td>{enquiry.company_name}</td>
                    <td>{enquiry.contact_person}</td>
                    <td>{enquiry.enquiry_date}</td>
                    <td>{enquiry.required_date}</td>
                    <td>
                      <span
                        className={`status ${enquiry.status.toLowerCase()}`}
                      >
                        {enquiry.status}
                      </span>
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

export default Enquiries;