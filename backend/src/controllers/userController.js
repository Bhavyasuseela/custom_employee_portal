const bcrypt = require("bcryptjs");
const pool = require("../config/database");

const getUsers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                u.id,
                u.username,
                u.email,
                r.name AS role,
                u.is_active,
                u.created_at,
                u.updated_at
            FROM public.users u
            LEFT JOIN public.user_roles ur
                ON u.id = ur.user_id
            LEFT JOIN public.roles r
                ON ur.role_id = r.id
            ORDER BY u.id ASC
        `);

        res.status(200).json({
            success: true,
            users: result.rows
        });
    } catch (error) {
        console.error("Get users error:", error);

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const createUser = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        if (!username || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "Username, email, password and role are required"
            });
        }

        const existingUser = await pool.query(
            `
            SELECT id
            FROM public.users
            WHERE username = $1 OR email = $2
            `,
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Username or email already exists"
            });
        }

        const roleResult = await pool.query(
            `
            SELECT id, name
            FROM public.roles
            WHERE LOWER(name) = LOWER($1)
            `,
            [role]
        );

        if (roleResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid role"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const userResult = await pool.query(
            `
            INSERT INTO public.users
                (username, email, password_hash, is_active)
            VALUES
                ($1, $2, $3, true)
            RETURNING id, username, email, is_active, created_at, updated_at
            `,
            [username, email, passwordHash]
        );

        const newUser = userResult.rows[0];

        await pool.query(
            `
            INSERT INTO public.user_roles
                (user_id, role_id)
            VALUES
                ($1, $2)
            `,
            [newUser.id, roleResult.rows[0].id]
        );

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: roleResult.rows[0].name,
                is_active: newUser.is_active,
                created_at: newUser.created_at,
                updated_at: newUser.updated_at
            }
        });

    } catch (error) {
        console.error("Create user error:", error);

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, password, role, is_active } = req.body;

        if (!username || !email || !role) {
            return res.status(400).json({
                success: false,
                message: "Username, email and role are required"
            });
        }

        const existingUser = await pool.query(
            `
            SELECT id
            FROM public.users
            WHERE (username = $1 OR email = $2)
            AND id <> $3
            `,
            [username, email, id]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Username or email already exists"
            });
        }

        const roleResult = await pool.query(
            `
            SELECT id, name
            FROM public.roles
            WHERE LOWER(name) = LOWER($1)
            `,
            [role]
        );

        if (roleResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid role"
            });
        }

        let userResult;

        if (password) {
            const passwordHash = await bcrypt.hash(password, 10);

            userResult = await pool.query(
                `
                UPDATE public.users
                SET
                    username = $1,
                    email = $2,
                    password_hash = $3,
                    is_active = $4,
                    updated_at = NOW()
                WHERE id = $5
                RETURNING id, username, email, is_active, created_at, updated_at
                `,
                [username, email, passwordHash, is_active, id]
            );
        } else {
            userResult = await pool.query(
                `
                UPDATE public.users
                SET
                    username = $1,
                    email = $2,
                    is_active = $3,
                    updated_at = NOW()
                WHERE id = $4
                RETURNING id, username, email, is_active, created_at, updated_at
                `,
                [username, email, is_active, id]
            );
        }

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const updatedUser = userResult.rows[0];

        await pool.query(
            `
            UPDATE public.user_roles
            SET role_id = $1
            WHERE user_id = $2
            `,
            [roleResult.rows[0].id, id]
        );

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                role: roleResult.rows[0].name,
                is_active: updatedUser.is_active,
                created_at: updatedUser.created_at,
                updated_at: updatedUser.updated_at
            }
        });

    } catch (error) {
        console.error("Update user error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const userResult = await pool.query(
            `
            SELECT id, username
            FROM public.users
            WHERE id = $1
            `,
            [id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        await pool.query(
            `
            DELETE FROM public.user_roles
            WHERE user_id = $1
            `,
            [id]
        );

        await pool.query(
            `
            DELETE FROM public.users
            WHERE id = $1
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
            user: {
                id: userResult.rows[0].id,
                username: userResult.rows[0].username
            }
        });

    } catch (error) {
        console.error("Delete user error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUser
};