const express = require("express");
const { login } = require("../controllers/authController");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", login);

router.get("/me", authenticateToken, (req, res) => {
    res.status(200).json({
        success: true,
        user: req.user
    });
});

module.exports = router;