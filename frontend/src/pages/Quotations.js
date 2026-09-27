import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Quotations.css";

const Quotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [products, setProducts] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    quotation_number: "",
    enquiry_id: "",
    valid_until: "",
  });

  const [items, setItems] = useState([
    {
      product_id: "",
      quantity: 1,
      unit_price: 0,
      discount_percent: 0,
      gst_percent: 18,
    },
  ]);

  const token = localStorage.getItem("token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchQuotations = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/quotations",
        authConfig
      );

      setQuotations(response.data.quotations);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load quotations"
      );
    } finally {
      setLoading(false);
    }
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
    fetchQuotations();
    fetchEnquiries();
    fetchProducts();
  }, []);

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];

    updatedItems[index][field] = value;

    if (field === "product_id") {
      const selectedProduct = products.find(
        (product) => product.id === value
      );

      if (selectedProduct) {
        updatedItems[index].unit_price = Number(
          selectedProduct.base_price
        );
      }
    }

    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        product_id: "",
        quantity: 1,
        unit_price: 0,
        discount_percent: 0,
        gst_percent: 18,
      },
    ]);
  };

  const removeItem = (index) => {
    if (items.length === 1) {
      return;
    }

    setItems(
      items.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const calculateLineAmount = (item) => {
    const baseAmount =
      Number(item.quantity || 0) *
      Number(item.unit_price || 0);

    const discountAmount =
      baseAmount *
      (Number(item.discount_percent || 0) / 100);

    const amountAfterDiscount =
      baseAmount - discountAmount;

    const gstAmount =
      amountAfterDiscount *
      (Number(item.gst_percent || 0) / 100);

    return amountAfterDiscount + gstAmount;
  };

  const calculateGrandTotal = () => {
    return items
      .reduce(
        (total, item) =>
          total + calculateLineAmount(item),
        0
      )
      .toFixed(2);
  };

  const resetForm = () => {
    setFormData({
      quotation_number: "",
      enquiry_id: "",
      valid_until: "",
    });

    setItems([
      {
        product_id: "",
        quantity: 1,
        unit_price: 0,
        discount_percent: 0,
        gst_percent: 18,
      },
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await axios.post(
        "http://localhost:5000/api/quotations",
        {
          ...formData,
          items,
        },
        authConfig
      );

      resetForm();
      setShowForm(false);
      setSuccess("Quotation created successfully.");
      fetchQuotations();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to create quotation"
      );
    }
  };

  const updateStatus = async (id, status) => {
    setError("");
    setSuccess("");

    try {
      await axios.patch(
        `http://localhost:5000/api/quotations/${id}/status`,
        { status },
        authConfig
      );

      setSuccess(`Quotation status changed to ${status}.`);
      fetchQuotations();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to update quotation status"
      );
    }
  };

  const convertToSalesOrder = async (quotationId) => {
    setError("");
    setSuccess("");

    try {
      await axios.post(
        `http://localhost:5000/api/sales-orders/from-quotation/${quotationId}`,
        {},
        authConfig
      );

      setSuccess("Sales Order created successfully.");
      fetchQuotations();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to create Sales Order"
      );
    }
  };

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1>Quotations</h1>
          <p>Create and manage customer quotations</p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "New Quotation"}
        </button>
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

      {showForm && (
        <div className="form-card">
          <h2>Create Quotation</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Quotation Number</label>

                <input
                  type="text"
                  name="quotation_number"
                  value={formData.quotation_number}
                  onChange={handleFormChange}
                  placeholder="QUO-003"
                  required
                />
              </div>

              <div className="form-group">
                <label>Enquiry</label>

                <select
                  name="enquiry_id"
                  value={formData.enquiry_id}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">
                    Select Enquiry
                  </option>

                  {enquiries
                    .filter(
                      (enquiry) =>
                        enquiry.status !== "LOST"
                    )
                    .map((enquiry) => (
                      <option
                        key={enquiry.id}
                        value={enquiry.id}
                      >
                        {enquiry.enquiry_number} -{" "}
                        {enquiry.company_name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label>Valid Until</label>

                <input
                  type="date"
                  name="valid_until"
                  value={formData.valid_until}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>

            <div className="items-section">
              <div className="items-header">
                <h3>Quotation Items</h3>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={addItem}
                >
                  Add Product
                </button>
              </div>

              {items.map((item, index) => (
                <div
                  className="quotation-item"
                  key={index}
                >
                  <div className="form-group">
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

                  <div className="form-group">
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

                  <div className="form-group">
                    <label>Unit Price</label>

                    <input
                      type="number"
                      min="0"
                      value={item.unit_price}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "unit_price",
                          Number(e.target.value)
                        )
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Discount %</label>

                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discount_percent}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "discount_percent",
                          Number(e.target.value)
                        )
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>GST %</label>

                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.gst_percent}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "gst_percent",
                          Number(e.target.value)
                        )
                      }
                    />
                  </div>

                  <div className="line-amount">
                    <span>Line Amount</span>
                    <strong>
                      ₹{calculateLineAmount(item).toFixed(2)}
                    </strong>
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

            <div className="total-section">
              <span>Estimated Grand Total</span>
              <strong>₹{calculateGrandTotal()}</strong>
            </div>

            <button
              type="submit"
              className="primary-button"
            >
              Create Quotation
            </button>
          </form>
        </div>
      )}

      <div className="table-card">
        <div className="table-header">
          <h2>Quotation List</h2>
          <span>{quotations.length} quotations</span>
        </div>

        {loading ? (
          <p className="empty-message">
            Loading quotations...
          </p>
        ) : quotations.length === 0 ? (
          <p className="empty-message">
            No quotations found.
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Quotation No.</th>
                  <th>Enquiry</th>
                  <th>Company</th>
                  <th>Valid Until</th>
                  <th>Grand Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {quotations.map((quotation) => (
                  <tr key={quotation.id}>
                    <td>{quotation.quotation_number}</td>
                    <td>{quotation.enquiry_number}</td>
                    <td>{quotation.company_name}</td>
                    <td>{quotation.valid_until}</td>
                    <td>
                      ₹
                      {Number(
                        quotation.grand_total
                      ).toFixed(2)}
                    </td>
                    <td>
                      <span
                        className={`status ${quotation.status.toLowerCase()}`}
                      >
                        {quotation.status}
                      </span>
                    </td>

                    <td>
                      <div className="action-buttons">
                        {quotation.status === "DRAFT" && (
                          <button
                            className="small-button"
                            onClick={() =>
                              updateStatus(
                                quotation.id,
                                "SENT"
                              )
                            }
                          >
                            Send
                          </button>
                        )}

                        {quotation.status === "SENT" && (
                          <>
                            <button
                              className="small-button success"
                              onClick={() =>
                                updateStatus(
                                  quotation.id,
                                  "ACCEPTED"
                                )
                              }
                            >
                              Accept
                            </button>

                            <button
                              className="small-button danger"
                              onClick={() =>
                                updateStatus(
                                  quotation.id,
                                  "REJECTED"
                                )
                              }
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {quotation.status === "ACCEPTED" && (
                          <button
                            className="small-button"
                            onClick={() =>
                              convertToSalesOrder(
                                quotation.id
                              )
                            }
                          >
                            Create Order
                          </button>
                        )}
                      </div>
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

export default Quotations;