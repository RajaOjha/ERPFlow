const express = require("express");

const {
  createDispatch,
  getDispatches
} = require("../controllers/dispatchesController");

const authenticateToken = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
  "/",
  authenticateToken,
  allowRoles("ADMIN"),
  createDispatch
);

router.get(
  "/",
  authenticateToken,
  getDispatches
);

module.exports = router;