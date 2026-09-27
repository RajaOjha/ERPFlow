const pool = require("../config/db");

const createDispatch = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      sales_order_id,
      dispatch_number,
      dispatch_date,
      vehicle_number,
      driver_name,
      items
    } = req.body;

    if (
      !sales_order_id ||
      !dispatch_number ||
      !dispatch_date ||
      !vehicle_number ||
      !driver_name ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        message: "Dispatch details and at least one item are required"
      });
    }

    await client.query("BEGIN");

    // 1. Get and lock Sales Order
    const orderResult = await client.query(
      `SELECT id, status
       FROM sales_orders
       WHERE id = $1
       FOR UPDATE`,
      [sales_order_id]
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Sales Order not found"
      });
    }

    const order = orderResult.rows[0];

    // 2. Order must be CONFIRMED
    if (order.status !== "CONFIRMED") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: `Cannot dispatch Sales Order with status ${order.status}`
      });
    }

    // 3. Prevent duplicate dispatch
    const existingDispatch = await client.query(
      `SELECT id, dispatch_number
       FROM dispatches
       WHERE sales_order_id = $1`,
      [sales_order_id]
    );

    if (existingDispatch.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "Dispatch already exists for this Sales Order",
        dispatch: existingDispatch.rows[0]
      });
    }

    // 4. Get quantities belonging specifically to this Sales Order
    const orderItemsResult = await client.query(
      `SELECT product_id, quantity
       FROM sales_order_items
       WHERE sales_order_id = $1`,
      [sales_order_id]
    );

    if (orderItemsResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Sales Order has no items"
      });
    }

    const orderItems = new Map();

    for (const item of orderItemsResult.rows) {
      orderItems.set(
        item.product_id,
        Number(item.quantity)
      );
    }

    // 5. Combine duplicate product entries from request
    const requestedItems = new Map();

    for (const item of items) {
      if (
        !item.product_id ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) <= 0
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message:
            "Each dispatch item must have a valid product and positive quantity"
        });
      }

      const quantity = Number(item.quantity);

      requestedItems.set(
        item.product_id,
        (requestedItems.get(item.product_id) || 0) + quantity
      );
    }

    // 6. Validate each requested item against this Sales Order
    for (const [productId, requestedQuantity] of requestedItems) {
      const orderedQuantity = orderItems.get(productId);

      if (orderedQuantity === undefined) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: "Product does not belong to this Sales Order",
          product_id: productId
        });
      }

      if (requestedQuantity > orderedQuantity) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: "Dispatch quantity cannot exceed Sales Order quantity",
          product_id: productId,
          ordered_quantity: orderedQuantity,
          requested_quantity: requestedQuantity
        });
      }

      // Lock inventory row
      const inventoryResult = await client.query(
        `SELECT
           id,
           physical_quantity,
           reserved_quantity
         FROM inventory
         WHERE product_id = $1
         FOR UPDATE`,
        [productId]
      );

      if (inventoryResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message: `Inventory not found for product ${productId}`
        });
      }

      const inventory = inventoryResult.rows[0];

      if (
        requestedQuantity >
        Number(inventory.reserved_quantity)
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: "Dispatch quantity cannot exceed reserved inventory",
          product_id: productId,
          reserved_quantity: inventory.reserved_quantity,
          requested_quantity: requestedQuantity
        });
      }

      if (
        requestedQuantity >
        Number(inventory.physical_quantity)
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: "Dispatch quantity cannot exceed physical inventory",
          product_id: productId,
          physical_quantity: inventory.physical_quantity,
          requested_quantity: requestedQuantity
        });
      }
    }

    // 7. Create dispatch
    const dispatchResult = await client.query(
      `INSERT INTO dispatches
       (
         dispatch_number,
         sales_order_id,
         dispatch_date,
         vehicle_number,
         driver_name
       )
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        dispatch_number,
        sales_order_id,
        dispatch_date,
        vehicle_number,
        driver_name
      ]
    );

    const dispatch = dispatchResult.rows[0];

    // 8. Insert dispatch items and update inventory
    for (const [productId, quantity] of requestedItems) {
      await client.query(
        `INSERT INTO dispatch_items
         (
           dispatch_id,
           product_id,
           quantity
         )
         VALUES ($1, $2, $3)`,
        [
          dispatch.id,
          productId,
          quantity
        ]
      );

      await client.query(
        `UPDATE inventory
         SET
           physical_quantity = physical_quantity - $1,
           reserved_quantity = reserved_quantity - $1
         WHERE product_id = $2`,
        [
          quantity,
          productId
        ]
      );
    }

    // 9. Mark Sales Order as dispatched
    const updatedOrder = await client.query(
      `UPDATE sales_orders
       SET status = 'DISPATCHED'
       WHERE id = $1
       RETURNING *`,
      [sales_order_id]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Dispatch created successfully",
      dispatch,
      sales_order: updatedOrder.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create dispatch error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "Dispatch number or Sales Order already has a dispatch"
      });
    }

    res.status(500).json({
      message: "Server error"
    });

  } finally {
    client.release();
  }
};


const getDispatches = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         d.id,
         d.dispatch_number,
         d.sales_order_id,
         d.dispatch_date,
         d.vehicle_number,
         d.driver_name,
         so.order_number
       FROM dispatches d
       JOIN sales_orders so
         ON d.sales_order_id = so.id
       ORDER BY d.dispatch_date DESC`
    );

    res.json({
      dispatches: result.rows
    });

  } catch (error) {
    console.error("Get dispatches error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};


module.exports = {
  createDispatch,
  getDispatches
};