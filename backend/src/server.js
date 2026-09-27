const express = require("express");
const cors = require("cors");
require("dotenv").config({ override: true });

const authRoutes = require("./routes/authRoutes");
const customersRoutes = require("./routes/customersRoutes");
const enquiriesRoutes = require("./routes/enquiriesRoutes");
const quotationsRoutes = require("./routes/quotationsRoutes");
const salesOrdersRoutes = require("./routes/salesOrdersRoutes");
const dispatchesRoutes = require("./routes/dispatchesRoutes");
const productsRoutes = require("./routes/productsRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");


const pool = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/enquiries", enquiriesRoutes);
app.use("/api/quotations", quotationsRoutes);
app.use("/api/sales-orders", salesOrdersRoutes);
app.use("/api/dispatches", dispatchesRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/dashboard", dashboardRoutes);


app.get("/", (req, res) => {
  res.json({
    message: "ERPFlow Backend is running"
  });
});

app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      message: "ERPFlow API is running",
      database: "connected",
      time: result.rows[0].now
    });
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      message: "Database connection failed"
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});