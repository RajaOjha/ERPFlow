const express = require("express");

const {
  createQuotation,
  getQuotations,
  updateQuotationStatus
} = require("../controllers/quotationsController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  authenticateToken,
  createQuotation
);

router.get(
  "/",
  authenticateToken,
  getQuotations
);

router.patch(
  "/:id/status",
  authenticateToken,
  updateQuotationStatus
);

module.exports = router;