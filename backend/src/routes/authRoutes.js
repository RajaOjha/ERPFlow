const express = require("express");
const { login } = require("../controllers/authController");
const authenticateToken = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/login", login);

router.get("/me", authenticateToken, (req, res) => {
  res.json({
    message: "Protected route accessed successfully",
    user: req.user
  });
});

router.get(
  "/admin-test",
  authenticateToken,
  allowRoles("ADMIN"),
  (req, res) => {
    res.json({
      message: "ADMIN access granted"
    });
  }
);

module.exports = router;