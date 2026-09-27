require("dotenv").config();

const bcrypt = require("bcryptjs");
const pool = require("../src/config/db");

const createUsers = async () => {
  try {
    const adminPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD,
      10
    );

    const salesPassword = await bcrypt.hash(
      process.env.SALES_PASSWORD,
      10
    );

    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES
       ($1, $2, $3, $4),
       ($5, $6, $7, $8)
       ON CONFLICT (email)
       DO UPDATE SET
         name = EXCLUDED.name,
         password_hash = EXCLUDED.password_hash,
         role = EXCLUDED.role`,
      [
        "ERP Admin",
        "admin@erpflow.com",
        adminPassword,
        "ADMIN",
        "Sales User",
        "sales@erpflow.com",
        salesPassword,
        "SALES_USER"
      ]
    );

    console.log("Users created successfully");

    process.exit(0);
  } catch (error) {
    console.error("Error creating users:", error);
    process.exit(1);
  }
};

createUsers();