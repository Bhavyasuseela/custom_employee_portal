const express = require("express");

const authenticateToken = require("../middleware/authMiddleware");
const requirePermission = require("../middleware/permissionMiddleware");

const {
    getUsers,
    createUser,
    updateUser,
    deleteUser
} = require("../controllers/userController");

const router = express.Router();

router.get(
    "/profile",
    authenticateToken,
    (req, res) => {
        res.json({
            success: true,
            user: req.user
        });
    }
);

router.get(
    "/",
    authenticateToken,
    requirePermission("users.read"),
    getUsers
);

router.post(
    "/",
    authenticateToken,
    requirePermission("users.create"),
    createUser
);

router.put(
    "/:id",
    authenticateToken,
    requirePermission("users.update"),
    updateUser
);

router.delete(
    "/:id",
    authenticateToken,
    requirePermission("users.delete"),
    deleteUser
);

module.exports = router;