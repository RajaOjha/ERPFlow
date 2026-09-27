const pool = require("../config/db");

const createCustomer = async (req, res) => {
  try {
    const {
      company_name,
      contact_person,
      mobile,
      email,
      city
    } = req.body;

    if (!company_name || !contact_person || !mobile) {
      return res.status(400).json({
        message: "Company name, contact person and mobile are required"
      });
    }

    const result = await pool.query(
      `INSERT INTO customers
       (company_name, contact_person, mobile, email, city)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        company_name,
        contact_person,
        mobile,
        email || null,
        city || null
      ]
    );

    res.status(201).json({
      message: "Customer created successfully",
      customer: result.rows[0]
    });

  } catch (error) {
    console.error("Create customer error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};

const getCustomers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM customers
       ORDER BY created_at DESC`
    );

    res.json({
      customers: result.rows
    });

  } catch (error) {
    console.error("Get customers error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};

module.exports = {
  createCustomer,
  getCustomers
};