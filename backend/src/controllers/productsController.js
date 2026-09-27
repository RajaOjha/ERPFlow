const pool = require("../config/db");

const getProducts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, product_code, product_name, category, unit, base_price
       FROM products
       ORDER BY product_code`
    );

    res.json({
      products: result.rows
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({
      message: "Server error"
    });
  }
};

const getInventory = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         i.id,
         p.id AS product_id,
         p.product_code,
         p.product_name,
         p.category,
         p.unit,
         i.physical_quantity,
         i.reserved_quantity,
         (i.physical_quantity - i.reserved_quantity) AS available_quantity
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       ORDER BY p.product_code`
    );

    res.json({
      inventory: result.rows
    });
  } catch (error) {
    console.error("Get inventory error:", error);
    res.status(500).json({
      message: "Server error"
    });
  }
};

module.exports = {
  getProducts,
  getInventory
};