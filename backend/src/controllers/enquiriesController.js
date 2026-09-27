const pool = require("../config/db");

const createEnquiry = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      customer_id,
      enquiry_number,
      enquiry_date,
      required_date,
      notes,
      items
    } = req.body;

    // Basic validation
    if (
      !customer_id ||
      !enquiry_number ||
      !enquiry_date ||
      !required_date ||
      !items ||
      items.length === 0
    ) {
      return res.status(400).json({
        message: "Customer, enquiry details and at least one product are required"
      });
    }

    await client.query("BEGIN");

    // Check customer exists
    const customerResult = await client.query(
      "SELECT id FROM customers WHERE id = $1",
      [customer_id]
    );

    if (customerResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Customer not found"
      });
    }

    // Validate each product
    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: "Each item must have a valid product and quantity"
        });
      }

      const productResult = await client.query(
        "SELECT id FROM products WHERE id = $1",
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message: `Product not found: ${item.product_id}`
        });
      }
    }

    // Create enquiry
    const enquiryResult = await client.query(
      `INSERT INTO enquiries
       (
         enquiry_number,
         customer_id,
         enquiry_date,
         required_date,
         notes,
         status,
         created_by
       )
       VALUES ($1, $2, $3, $4, $5, 'NEW', $6)
       RETURNING *`,
      [
        enquiry_number,
        customer_id,
        enquiry_date,
        required_date,
        notes || null,
        req.user.id
      ]
    );

    const enquiry = enquiryResult.rows[0];

    // Add enquiry items
    for (const item of items) {
      await client.query(
        `INSERT INTO enquiry_items
         (enquiry_id, product_id, quantity)
         VALUES ($1, $2, $3)`,
        [
          enquiry.id,
          item.product_id,
          item.quantity
        ]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Enquiry created successfully",
      enquiry_id: enquiry.id,
      enquiry_number: enquiry.enquiry_number,
      status: enquiry.status
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create enquiry error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "Enquiry number already exists"
      });
    }

    res.status(500).json({
      message: "Server error"
    });

  } finally {
    client.release();
  }
};


const getEnquiries = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         e.id,
         e.enquiry_number,
         e.enquiry_date,
         e.required_date,
         e.notes,
         e.status,
         e.created_at,
         c.company_name,
         c.contact_person
       FROM enquiries e
       JOIN customers c
         ON e.customer_id = c.id
       ORDER BY e.created_at DESC`
    );

    res.json({
      enquiries: result.rows
    });

  } catch (error) {
    console.error("Get enquiries error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};


module.exports = {
  createEnquiry,
  getEnquiries
};