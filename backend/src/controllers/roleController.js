const pool = require("../config/database");

const getRoles = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                r.id,
                r.name AS role,
                COALESCE(
                    ARRAY_AGG(DISTINCT p.name)
                    FILTER (WHERE p.name IS NOT NULL),
                    ARRAY[]::text[]
                ) AS permissions
            FROM public.roles r
            LEFT JOIN public.role_permissions rp
                ON r.id = rp.role_id
            LEFT JOIN public.permissions p
                ON rp.permission_id = p.id
            GROUP BY r.id, r.name
            ORDER BY r.id ASC
        `);

        res.status(200).json({
            success: true,
            roles: result.rows
        });

    } catch (error) {
        console.error("Get roles error:", error);

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const updateRolePermissions = async (req, res) => {
    try {
        const roleId = req.params.id;
        const { permissions } = req.body;

        if (!Array.isArray(permissions)) {
            return res.status(400).json({
                success: false,
                message: "Permissions must be an array"
            });
        }

        const roleResult = await pool.query(
            `
            SELECT id, name
            FROM public.roles
            WHERE id = $1
            `,
            [roleId]
        );

        if (roleResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Role not found"
            });
        }

        const permissionResult = await pool.query(
            `
            SELECT id, name
            FROM public.permissions
            WHERE name = ANY($1::text[])
            `,
            [permissions]
        );

        if (permissionResult.rows.length !== permissions.length) {
            const validPermissions = permissionResult.rows.map(
                permission => permission.name
            );

            const invalidPermissions = permissions.filter(
                permission => !validPermissions.includes(permission)
            );

            return res.status(400).json({
                success: false,
                message: "Invalid permission(s)",
                invalidPermissions
            });
        }

        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            await client.query(
                `
                DELETE FROM public.role_permissions
                WHERE role_id = $1
                `,
                [roleId]
            );

            for (const permission of permissionResult.rows) {
                await client.query(
                    `
                    INSERT INTO public.role_permissions
                        (role_id, permission_id)
                    VALUES
                        ($1, $2)
                    `,
                    [roleId, permission.id]
                );
            }

            await client.query("COMMIT");

        } catch (error) {
            await client.query("ROLLBACK");
            throw error;

        } finally {
            client.release();
        }

        res.status(200).json({
            success: true,
            message: "Role permissions updated successfully",
            role: {
                id: roleResult.rows[0].id,
                role: roleResult.rows[0].name,
                permissions
            }
        });

    } catch (error) {
        console.error("Update role permissions error:", error);

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = {
    getRoles,
    updateRolePermissions
}; 