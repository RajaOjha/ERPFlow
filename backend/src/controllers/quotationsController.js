const pool = require("../config/db");

const createQuotation = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      quotation_number,
      enquiry_id,
      valid_until,
      items
    } = req.body;

    if (
      !quotation_number ||
      !enquiry_id ||
      !valid_until ||
      !items ||
      items.length === 0
    ) {
      return res.status(400).json({
        message: "Quotation details and at least one item are required"
      });
    }

    await client.query("BEGIN");

    // 1. Check enquiry exists
    const enquiryResult = await client.query(
      `SELECT id, customer_id, status
       FROM enquiries
       WHERE id = $1`,
      [enquiry_id]
    );

    if (enquiryResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Enquiry not found"
      });
    }

    const enquiry = enquiryResult.rows[0];

    // 2. Prevent quotation for an invalid enquiry status
    if (enquiry.status === "LOST") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Cannot create quotation for a lost enquiry"
      });
    }

    let grandTotal = 0;
    const quotationItems = [];

    // 3. Validate products and calculate amounts
    for (const item of items) {
      const {
        product_id,
        quantity,
        unit_price,
        discount_percent = 0,
        gst_percent = 0
      } = item;

      if (
        !product_id ||
        !quantity ||
        quantity <= 0 ||
        unit_price === undefined ||
        unit_price < 0
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: "Invalid product, quantity or unit price"
        });
      }

      if (
        discount_percent < 0 ||
        discount_percent > 100 ||
        gst_percent < 0 ||
        gst_percent > 100
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: "Discount and GST must be between 0 and 100"
        });
      }

      const productResult = await client.query(
        `SELECT id, product_name
         FROM products
         WHERE id = $1`,
        [product_id]
      );

      if (productResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message: `Product not found: ${product_id}`
        });
      }

      // Backend calculation
      const baseAmount = Number(quantity) * Number(unit_price);

      const discountAmount =
        baseAmount * (Number(discount_percent) / 100);

      const amountAfterDiscount =
        baseAmount - discountAmount;

      const gstAmount =
        amountAfterDiscount * (Number(gst_percent) / 100);

      const lineAmount =
        amountAfterDiscount + gstAmount;

      grandTotal += lineAmount;

      quotationItems.push({
        product_id,
        quantity,
        unit_price,
        discount_percent,
        gst_percent,
        line_amount: lineAmount
      });
    }

    // Round grand total to 2 decimal places
    grandTotal = Number(grandTotal.toFixed(2));

    // 4. Create quotation
    const quotationResult = await client.query(
      `INSERT INTO quotations
       (
         quotation_number,
         enquiry_id,
         customer_id,
         valid_until,
         grand_total,
         status,
         created_by
       )
       VALUES ($1, $2, $3, $4, $5, 'DRAFT', $6)
       RETURNING *`,
      [
        quotation_number,
        enquiry_id,
        enquiry.customer_id,
        valid_until,
        grandTotal,
        req.user.id
      ]
    );

    const quotation = quotationResult.rows[0];

    // 5. Insert quotation items
    for (const item of quotationItems) {
      await client.query(
        `INSERT INTO quotation_items
         (
           quotation_id,
           product_id,
           quantity,
           unit_price,
           discount_percent,
           gst_percent,
           line_amount
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          quotation.id,
          item.product_id,
          item.quantity,
          item.unit_price,
          item.discount_percent,
          item.gst_percent,
          item.line_amount
        ]
      );
    }

    // 6. Update enquiry status
    await client.query(
      `UPDATE enquiries
       SET status = 'QUOTED'
       WHERE id = $1`,
      [enquiry_id]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Quotation created successfully",
      quotation: {
        id: quotation.id,
        quotation_number: quotation.quotation_number,
        enquiry_id: quotation.enquiry_id,
        customer_id: quotation.customer_id,
        grand_total: quotation.grand_total,
        status: quotation.status
      },
      items: quotationItems
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create quotation error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "Quotation number already exists"
      });
    }

    res.status(500).json({
      message: "Server error"
    });

  } finally {
    client.release();
  }
};


const getQuotations = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         q.id,
         q.quotation_number,
         q.enquiry_id,
         q.customer_id,
         q.valid_until,
         q.grand_total,
         q.status,
         q.created_at,
         c.company_name,
         e.enquiry_number
       FROM quotations q
       JOIN customers c
         ON q.customer_id = c.id
       JOIN enquiries e
         ON q.enquiry_id = e.id
       ORDER BY q.created_at DESC`
    );

    res.json({
      quotations: result.rows
    });

  } catch (error) {
    console.error("Get quotations error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};


const updateQuotationStatus = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["DRAFT", "SENT", "ACCEPTED", "REJECTED"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid quotation status"
      });
    }

    await client.query("BEGIN");

    const quotationResult = await client.query(
      `SELECT id, status
       FROM quotations
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (quotationResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Quotation not found"
      });
    }

    const quotation = quotationResult.rows[0];
    const currentStatus = quotation.status;

    // DRAFT can only move to SENT
    if (currentStatus === "DRAFT" && status !== "SENT") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Draft quotation can only be moved to SENT"
      });
    }

    // SENT can move to ACCEPTED or REJECTED
    if (
      currentStatus === "SENT" &&
      !["ACCEPTED", "REJECTED"].includes(status)
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Sent quotation can only be ACCEPTED or REJECTED"
      });
    }

    // ACCEPTED and REJECTED are final states
    if (["ACCEPTED", "REJECTED"].includes(currentStatus)) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: `Quotation with status ${currentStatus} cannot be changed`
      });
    }

    const updatedQuotation = await client.query(
      `UPDATE quotations
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    await client.query("COMMIT");

    res.json({
      message: "Quotation status updated successfully",
      quotation: updatedQuotation.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Update quotation status error:", error);

    res.status(500).json({
      message: "Server error"
    });

  } finally {
    client.release();
  }
};

module.exports = {
  createQuotation,
  getQuotations,
  updateQuotationStatus
};