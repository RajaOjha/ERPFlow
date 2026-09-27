const express = require("express");
const {
  getProducts,
  getInventory
} = require("../controllers/productsController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticateToken, getProducts);
router.get("/inventory", authenticateToken, getInventory);

module.exports = router;