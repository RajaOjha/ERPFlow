const pool = require("../config/db");

const getDashboardStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM enquiries) AS enquiries,
        (SELECT COUNT(*) FROM quotations) AS quotations,
        (SELECT COUNT(*) FROM sales_orders) AS sales_orders,
        (SELECT COUNT(*) FROM dispatches) AS dispatches
    `);

    const stats = result.rows[0];

    res.json({
      enquiries: Number(stats.enquiries),
      quotations: Number(stats.quotations),
      sales_orders: Number(stats.sales_orders),
      dispatches: Number(stats.dispatches)
    });

  } catch (error) {
    console.error("Get dashboard stats error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};

module.exports = {
  getDashboardStats
};