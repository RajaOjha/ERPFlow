const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  convertQuotationToSalesOrder,
  getSalesOrders,
  confirmSalesOrder,
  cancelSalesOrder
} = require("../controllers/salesOrdersController");

const authenticateToken = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
  "/from-quotation/:quotation_id",
  authenticateToken,
  convertQuotationToSalesOrder
);

router.get(
  "/",
  authenticateToken,
  getSalesOrders
);

router.post(
  "/:id/confirm",
  authenticateToken,
  allowRoles("ADMIN"),
  confirmSalesOrder
);
router.post(
  "/:id/cancel",
  authMiddleware,
  allowRoles("ADMIN"),
  cancelSalesOrder
);
module.exports = router;