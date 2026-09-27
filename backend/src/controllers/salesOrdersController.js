const pool = require("../config/db");

const convertQuotationToSalesOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const { quotation_id } = req.params;

    await client.query("BEGIN");

    // 1. Get quotation
    const quotationResult = await client.query(
      `SELECT
         id,
         customer_id,
         grand_total,
         status
       FROM quotations
       WHERE id = $1
       FOR UPDATE`,
      [quotation_id]
    );

    if (quotationResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Quotation not found"
      });
    }

    const quotation = quotationResult.rows[0];

    // 2. Only ACCEPTED quotations can become orders
    if (quotation.status !== "ACCEPTED") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Only accepted quotations can be converted to sales orders"
      });
    }

    // 3. Prevent duplicate Sales Order
    const existingOrder = await client.query(
      `SELECT id, order_number, status
       FROM sales_orders
       WHERE quotation_id = $1`,
      [quotation_id]
    );

    if (existingOrder.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "Sales Order already exists for this quotation",
        sales_order: existingOrder.rows[0]
      });
    }

    // 4. Generate order number
    const countResult = await client.query(
      `SELECT COUNT(*) AS count
       FROM sales_orders`
    );

    const orderNumber = `SO-${String(
      Number(countResult.rows[0].count) + 1
    ).padStart(3, "0")}`;

    // 5. Create Sales Order
    const orderResult = await client.query(
      `INSERT INTO sales_orders
       (
         order_number,
         quotation_id,
         customer_id,
         order_date,
         total_amount,
         status
       )
       VALUES
       ($1, $2, $3, CURRENT_DATE, $4, 'PENDING')
       RETURNING *`,
      [
        orderNumber,
        quotation.id,
        quotation.customer_id,
        quotation.grand_total
      ]
    );

    const salesOrder = orderResult.rows[0];

    // 6. Copy quotation items into Sales Order items
    const itemsResult = await client.query(
      `SELECT
         product_id,
         quantity,
         unit_price
       FROM quotation_items
       WHERE quotation_id = $1`,
      [quotation_id]
    );

    for (const item of itemsResult.rows) {
      await client.query(
        `INSERT INTO sales_order_items
         (
           sales_order_id,
           product_id,
           quantity,
           unit_price
         )
         VALUES ($1, $2, $3, $4)`,
        [
          salesOrder.id,
          item.product_id,
          item.quantity,
          item.unit_price
        ]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Sales Order created successfully",
      sales_order: salesOrder
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Convert quotation error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "Sales Order already exists for this quotation"
      });
    }

    res.status(500).json({
      message: "Server error"
    });

  } finally {
    client.release();
  }
};


const getSalesOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         so.id,
         so.order_number,
         so.quotation_id,
         so.customer_id,
         so.order_date,
         so.total_amount,
         so.status,
         c.company_name,
         q.quotation_number,

         COALESCE(
           (
             SELECT json_agg(
               json_build_object(
                 'id', soi.id,
                 'product_id', soi.product_id,
                 'product_code', p.product_code,
                 'product_name', p.product_name,
                 'quantity', soi.quantity,
                 'unit_price', soi.unit_price
               )
               ORDER BY p.product_code
             )
             FROM sales_order_items soi
             JOIN products p
               ON soi.product_id = p.id
             WHERE soi.sales_order_id = so.id
           ),
           '[]'::json
         ) AS items

       FROM sales_orders so
       JOIN customers c
         ON so.customer_id = c.id
       JOIN quotations q
         ON so.quotation_id = q.id
       ORDER BY so.order_date DESC`
    );

    res.json({
      sales_orders: result.rows
    });

  } catch (error) {
    console.error("Get sales orders error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};
const confirmSalesOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query("BEGIN");

    // 1. Get the Sales Order
    const orderResult = await client.query(
      `SELECT id, status
       FROM sales_orders
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Sales Order not found"
      });
    }

    const order = orderResult.rows[0];

    // 2. Order must be PENDING
    if (order.status !== "PENDING") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: `Sales Order cannot be confirmed because its status is ${order.status}`
      });
    }

    // 3. Get all order items
    const itemsResult = await client.query(
      `SELECT product_id, quantity
       FROM sales_order_items
       WHERE sales_order_id = $1`,
      [id]
    );

    // 4. Check and reserve every product
    for (const item of itemsResult.rows) {

      // Lock inventory row
      const inventoryResult = await client.query(
        `SELECT
           id,
           physical_quantity,
           reserved_quantity
         FROM inventory
         WHERE product_id = $1
         FOR UPDATE`,
        [item.product_id]
      );

      if (inventoryResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message: `Inventory not found for product ${item.product_id}`
        });
      }

      const inventory = inventoryResult.rows[0];

      const availableQuantity =
        inventory.physical_quantity -
        inventory.reserved_quantity;

      // 5. Prevent over-reservation
      if (Number(item.quantity) > Number(availableQuantity)) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: "Insufficient inventory",
          product_id: item.product_id,
          available_quantity: availableQuantity,
          requested_quantity: item.quantity
        });
      }

      // 6. Reserve stock
      await client.query(
        `UPDATE inventory
         SET reserved_quantity = reserved_quantity + $1
         WHERE product_id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // 7. Confirm Sales Order
    const updatedOrder = await client.query(
      `UPDATE sales_orders
       SET status = 'CONFIRMED'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    await client.query("COMMIT");

    res.json({
      message: "Sales Order confirmed and inventory reserved successfully",
      sales_order: updatedOrder.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Confirm Sales Order error:", error);

    res.status(500).json({
      message: "Server error"
    });

  } finally {
    client.release();
  }
};
const cancelSalesOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query("BEGIN");

    // 1. Get and lock the Sales Order
    const orderResult = await client.query(
      `SELECT id, status
       FROM sales_orders
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Sales Order not found"
      });
    }

    const order = orderResult.rows[0];

    // 2. Dispatched orders cannot be cancelled
    if (order.status === "DISPATCHED") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Dispatched Sales Orders cannot be cancelled"
      });
    }

    // 3. Already cancelled
    if (order.status === "CANCELLED") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Sales Order is already cancelled"
      });
    }

    // 4. If order is CONFIRMED, release reserved inventory
    if (order.status === "CONFIRMED") {
      const itemsResult = await client.query(
        `SELECT product_id, quantity
         FROM sales_order_items
         WHERE sales_order_id = $1`,
        [id]
      );

      for (const item of itemsResult.rows) {
        const inventoryResult = await client.query(
          `SELECT
             physical_quantity,
             reserved_quantity
           FROM inventory
           WHERE product_id = $1
           FOR UPDATE`,
          [item.product_id]
        );

        if (inventoryResult.rows.length === 0) {
          await client.query("ROLLBACK");

          return res.status(404).json({
            message: `Inventory not found for product ${item.product_id}`
          });
        }

        const inventory = inventoryResult.rows[0];

        if (
          Number(item.quantity) >
          Number(inventory.reserved_quantity)
        ) {
          await client.query("ROLLBACK");

          return res.status(400).json({
            message: "Reserved inventory is insufficient to release",
            product_id: item.product_id,
            reserved_quantity: inventory.reserved_quantity,
            release_quantity: item.quantity
          });
        }

        await client.query(
          `UPDATE inventory
           SET reserved_quantity = reserved_quantity - $1
           WHERE product_id = $2`,
          [item.quantity, item.product_id]
        );
      }
    }

    // 5. Cancel the Sales Order
    const updatedOrder = await client.query(
      `UPDATE sales_orders
       SET status = 'CANCELLED'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    await client.query("COMMIT");

    res.json({
      message: "Sales Order cancelled successfully",
      sales_order: updatedOrder.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Cancel Sales Order error:", error);

    res.status(500).json({
      message: "Server error"
    });

  } finally {
    client.release();
  }
};

module.exports = {
  convertQuotationToSalesOrder,
  getSalesOrders,
  confirmSalesOrder,
  cancelSalesOrder
};