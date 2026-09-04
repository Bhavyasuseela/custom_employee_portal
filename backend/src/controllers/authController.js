const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");

const login = async (req, res) => {
    try {
        const { login, password } = req.body;

        if (!login || !password) {
            return res.status(400).json({
                success: false,
                message: "Username/email and password are required"
            });
        }

        const result = await pool.query(
            `
            SELECT
                u.id,
                u.username,
                u.email,
                u.password_hash,
                u.is_active,
                r.name AS role,
                COALESCE(
                    ARRAY_AGG(DISTINCT p.name)
                    FILTER (WHERE p.name IS NOT NULL),
                    ARRAY[]::text[]
                ) AS permissions
            FROM public.users u
            JOIN public.user_roles ur
                ON u.id = ur.user_id
            JOIN public.roles r
                ON ur.role_id = r.id
            LEFT JOIN public.role_permissions rp
                ON r.id = rp.role_id
            LEFT JOIN public.permissions p
                ON rp.permission_id = p.id
            WHERE (u.username = $1 OR u.email = $1)
            GROUP BY
                u.id,
                u.username,
                u.email,
                u.password_hash,
                u.is_active,
                r.name
            LIMIT 1
            `,
            [login]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid username/email or password"
            });
        }

        const user = result.rows[0];

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: "User account is inactive"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid username/email or password"
            });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                permissions: user.permissions
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                permissions: user.permissions
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = {
    login
};