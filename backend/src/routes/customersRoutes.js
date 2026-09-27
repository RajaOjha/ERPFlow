const express = require("express");

const {
  createCustomer,
  getCustomers
} = require("../controllers/customersController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  authenticateToken,
  createCustomer
);

router.get(
  "/",
  authenticateToken,
  getCustomers
);

module.exports = router;