const express = require("express");

const authenticateToken = require("../middleware/authMiddleware");
const requirePermission = require("../middleware/permissionMiddleware");

const {
    getRoles,
    updateRolePermissions
} = require("../controllers/roleController");

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    requirePermission("roles.manage"),
    getRoles
);

router.put(
    "/:id/permissions",
    authenticateToken,
    requirePermission("roles.manage"),
    updateRolePermissions
);

module.exports = router;