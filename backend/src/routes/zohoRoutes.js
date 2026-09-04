const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");
const { getZohoAccessToken } = require("../config/zoho");
const requirePermission = require("../middleware/permissionMiddleware");

const router = express.Router();

router.get("/auth", (req, res) => {
    const params = new URLSearchParams({
        scope: "ZohoCRM.modules.ALL,ZOHOPEOPLE.forms.READ",
        client_id: process.env.ZOHO_CLIENT_ID,
        response_type: "code",
        access_type: "offline",
        redirect_uri: "http://localhost:5000/api/zoho/callback",
        prompt: "consent"
    });

    const authUrl =
        `https://accounts.zoho.in/oauth/v2/auth?${params.toString()}`;

    res.redirect(authUrl);
});

router.get("/callback", async (req, res) => {
    try {
        const { code } = req.query;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: "Authorization code not received"
            });
        }

        const params = new URLSearchParams({
            grant_type: "authorization_code",
            client_id: process.env.ZOHO_CLIENT_ID,
            client_secret: process.env.ZOHO_CLIENT_SECRET,
            redirect_uri: "http://localhost:5000/api/zoho/callback",
            code
        });

        const response = await fetch(
            "https://accounts.zoho.in/oauth/v2/token",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: params.toString()
            }
        );

        const data = await response.json();

        if (!response.ok || data.error) {
            console.error("Zoho token error:", data);

            return res.status(400).json({
                success: false,
                message: "Failed to generate Zoho tokens",
                error: data
            });
        }

        console.log("Zoho OAuth successful");
        console.log("Refresh token received:", !!data.refresh_token);

        res.json({
            success: true,
            message: "Zoho OAuth successful",
            api_domain: data.api_domain,
            expires_in: data.expires_in,
            refresh_token: data.refresh_token
        });

    } catch (error) {
        console.error("Zoho callback error:", error);

        res.status(500).json({
            success: false,
            message: "Zoho OAuth failed"
        });
    }
});

router.get(
    "/people",
    authenticateToken,
    requirePermission("zoho.people.access"),
    async (req, res) => {
        try {
            const { accessToken } =
                await getZohoAccessToken();

            const response = await fetch(
                "https://people.zoho.in/people/api/forms/employee/getRecords",
                {
                    method: "GET",
                    headers: {
                        Authorization: `Zoho-oauthtoken ${accessToken}`
                    }
                }
            );

            const responseText = await response.text();

            console.log("Zoho People status:", response.status);

            let data = {};

            if (responseText) {
                try {
                    data = JSON.parse(responseText);
                } catch (error) {
                    data = {
                        rawResponse: responseText
                    };
                }
            }

            if (!response.ok) {
                console.error("Zoho People API error:", data);

                return res.status(response.status).json({
                    success: false,
                    message: "Failed to fetch Zoho People employee data",
                    error: data
                });
            }

            const results = data?.response?.result || [];

            const employees = [];

            results.forEach((group) => {
                Object.values(group).forEach((records) => {
                    if (Array.isArray(records)) {
                        records.forEach((employee) => {
                            employees.push({
                                employeeId: employee.EmployeeID || null,
                                firstName: employee.FirstName || null,
                                lastName: employee.LastName || null,
                                nickname: employee.Nick_Name || null,
                                email: employee.EmailID || null,
                                department: employee.Department || null,
                                location: employee.LocationName || null,
                                designation: employee.Designation || null,
                                zohoRole: employee.Role || null,
                                employmentType: employee.Employee_type || null,
                                employeeStatus: employee.Employeestatus || null,
                                sourceOfHire: employee.Source_of_hire || null,
                                dateOfJoining: employee.Dateofjoining || null,
                                experience: employee.Experience || null,
                                totalExperience: employee.total_experience || null
                            });
                        });
                    }
                });
            });

            res.json({
                success: true,
                message: "Zoho People employees fetched successfully",
                count: employees.length,
                employees: employees
            });

        } catch (error) {
            console.error("Zoho People error:", error);

            res.status(500).json({
                success: false,
                message: "Zoho People connection failed"
            });
        }
    }
);  

router.get(
    "/crm",
    authenticateToken,
    requirePermission("zoho.crm.access"),
    async (req, res) => {
        try {
            const { accessToken, apiDomain } =
                await getZohoAccessToken();

            const response = await fetch(
                `${apiDomain}/crm/v8/Leads?fields=id,Full_Name,Company,Email,Phone,Lead_Status`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Zoho-oauthtoken ${accessToken}`
                    }
                }
            );

            const responseText = await response.text();

            console.log("Zoho CRM status:", response.status);
            console.log("Zoho CRM content type:", response.headers.get("content-type"));
            console.log("Zoho CRM response:", responseText);

            if (response.status === 204) {
                return res.json({
                    success: true,
                    message: "Zoho CRM connected successfully, but no Leads were found",
                    data: []
                });
            }
            let data = {};

            if (responseText) {
                try {
                    data = JSON.parse(responseText);
                } catch (error) {
                    data = {
                        rawResponse: responseText
                    };
                }
            }

            if (!response.ok) {
                console.error("Zoho CRM API error:", data);

                return res.status(response.status).json({
                    success: false,
                    message: "Failed to fetch Zoho CRM data",
                    error: data
                });
            }

            res.json({
                success: true,
                message: "Zoho CRM data fetched successfully",
                data: data
            });

        } catch (error) {
            console.error("Zoho CRM error:", error);

            res.status(500).json({
                success: false,
                message: "Zoho CRM connection failed"
            });
        }
    }
);

router.post(
    "/crm/leads",
    authenticateToken,
    requirePermission("zoho.crm.access"),
    async (req, res) => {
        try {
            const { accessToken, apiDomain } =
                await getZohoAccessToken();

            const response = await fetch(
                `${apiDomain}/crm/v8/Leads`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Zoho-oauthtoken ${accessToken}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        data: [
                            {
                                First_Name: req.body.First_Name,
                                Last_Name: req.body.Last_Name,
                                Company: req.body.Company,
                                Email: req.body.Email,
                                Phone: req.body.Phone,
                                Lead_Status: req.body.Lead_Status
                            }
                        ]
                    })
                }
            );

            const responseText = await response.text();

            console.log("Zoho Create Lead status:", response.status);
            console.log("Zoho Create Lead response:", responseText);

            let data = {};

            if (responseText) {
                try {
                    data = JSON.parse(responseText);
                } catch (error) {
                    data = {
                        rawResponse: responseText
                    };
                }
            }

            if (!response.ok) {
                return res.status(response.status).json({
                    success: false,
                    message: "Failed to create Zoho CRM Lead",
                    error: data
                });
            }

            res.status(201).json({
                success: true,
                message: "Zoho CRM Lead created successfully",
                data: data
            });

        } catch (error) {
            console.error("Zoho Create Lead error:", error);

            res.status(500).json({
                success: false,
                message: "Zoho CRM Lead creation failed"
            });
        }
    }
);
router.put(
    "/crm/leads/:id",
    authenticateToken,
    requirePermission("zoho.crm.access"),
    async (req, res) => {
        try {
            const { accessToken, apiDomain } =
                await getZohoAccessToken();

            const response = await fetch(
                `${apiDomain}/crm/v8/Leads/${req.params.id}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Zoho-oauthtoken ${accessToken}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        data: [
                            {
                                First_Name: req.body.First_Name,
                                Last_Name: req.body.Last_Name,
                                Company: req.body.Company,
                                Email: req.body.Email,
                                Phone: req.body.Phone,
                                Lead_Status: req.body.Lead_Status
                            }
                        ]
                    })
                }
            );

            const responseText = await response.text();

            console.log("Zoho Update Lead status:", response.status);
            console.log("Zoho Update Lead response:", responseText);

            let data = {};

            if (responseText) {
                try {
                    data = JSON.parse(responseText);
                } catch (error) {
                    data = {
                        rawResponse: responseText
                    };
                }
            }

            if (!response.ok) {
                return res.status(response.status).json({
                    success: false,
                    message: "Failed to update Zoho CRM Lead",
                    error: data
                });
            }

            res.json({
                success: true,
                message: "Zoho CRM Lead updated successfully",
                data: data
            });

        } catch (error) {
            console.error("Zoho Update Lead error:", error);

            res.status(500).json({
                success: false,
                message: "Zoho CRM Lead update failed"
            });
        }
    }
);

router.delete(
    "/crm/leads/:id",
    authenticateToken,
    requirePermission("zoho.crm.access"),
    async (req, res) => {
        try {
            const { accessToken, apiDomain } =
                await getZohoAccessToken();

            const response = await fetch(
                `${apiDomain}/crm/v8/Leads/${req.params.id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Zoho-oauthtoken ${accessToken}`
                    }
                }
            );

            const responseText = await response.text();

            console.log("Zoho Delete Lead status:", response.status);
            console.log("Zoho Delete Lead response:", responseText);

            let data = {};

            if (responseText) {
                try {
                    data = JSON.parse(responseText);
                } catch (error) {
                    data = {
                        rawResponse: responseText
                    };
                }
            }

            if (!response.ok) {
                return res.status(response.status).json({
                    success: false,
                    message: "Failed to delete Zoho CRM Lead",
                    error: data
                });
            }

            res.json({
                success: true,
                message: "Zoho CRM Lead deleted successfully",
                data: data
            });

        } catch (error) {
            console.error("Zoho Delete Lead error:", error);

            res.status(500).json({
                success: false,
                message: "Zoho CRM Lead deletion failed"
            });
        }
    }
);

router.get(
    "/desk",
    authenticateToken,
    requirePermission("zoho.desk.access"),
    (req, res) => {
        res.json({
            success: true,
            message: "Zoho Desk access granted"
        });
    }
);

router.get(
    "/books",
    authenticateToken,
    requirePermission("zoho.books.access"),
    (req, res) => {
        res.json({
            success: true,
            message: "Zoho Books access granted"
        });
    }
);

module.exports = router;