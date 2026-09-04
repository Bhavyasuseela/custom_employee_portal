import { useEffect, useState } from "react";
import "./App.css";

function App() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [department, setDepartment] = useState("All");

    const [token, setToken] = useState(
        localStorage.getItem("token") || ""
    );

    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("user");

        return savedUser
            ? JSON.parse(savedUser)
            : null;
    });

    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState("");
    const [loggingIn, setLoggingIn] = useState(false);

    const [activePage, setActivePage] = useState("dashboard");
    const [crmLeads, setCrmLeads] = useState([]);
    const [crmLoading, setCrmLoading] = useState(false);
    const [crmError, setCrmError] = useState("");

    const [deskTickets] = useState([
        {
            id: 1,
            ticketNumber: "ZD-1001",
            subject: "Unable to access employee portal",
            customer: "Ravi Kumar",
            priority: "High",
            status: "Open",
            agent: "Admin",
            created: "04 Sep 2026"
        },
        {
            id: 2,
            ticketNumber: "ZD-1002",
            subject: "Password reset request",
            customer: "Priya Sharma",
            priority: "Medium",
            status: "Pending",
            agent: "Support Team",
            created: "03 Sep 2026"
        },
        {
            id: 3,
            ticketNumber: "ZD-1003",
            subject: "CRM lead information issue",
            customer: "Arjun Reddy",
            priority: "High",
            status: "Open",
            agent: "Sales Support",
            created: "03 Sep 2026"
        },
        {
            id: 4,
            ticketNumber: "ZD-1004",
            subject: "Employee profile update",
            customer: "Sneha Devi",
            priority: "Low",
            status: "Closed",
            agent: "HR Support",
            created: "02 Sep 2026"
        },
        {
            id: 5,
            ticketNumber: "ZD-1005",
            subject: "Leave request clarification",
            customer: "Vikram Singh",
            priority: "Medium",
            status: "Open",
            agent: "HR Support",
            created: "01 Sep 2026"
        }
    ]);

    const [booksInvoices] = useState([
        {
            id: 1,
            invoiceNumber: "INV-1001",
            customer: "ABC Technologies",
            amount: "₹45,000",
            status: "Paid",
            date: "04 Sep 2026"
        },
        {
            id: 2,
            invoiceNumber: "INV-1002",
            customer: "Bright Solutions",
            amount: "₹28,500",
            status: "Pending",
            date: "03 Sep 2026"
        },
        {
            id: 3,
            invoiceNumber: "INV-1003",
            customer: "Global Systems",
            amount: "₹62,000",
            status: "Paid",
            date: "02 Sep 2026"
        },
        {
            id: 4,
            invoiceNumber: "INV-1004",
            customer: "Nova Enterprises",
            amount: "₹19,750",
            status: "Overdue",
            date: "01 Sep 2026"
        },
        {
            id: 5,
            invoiceNumber: "INV-1005",
            customer: "Vertex Solutions",
            amount: "₹35,200",
            status: "Pending",
            date: "31 Aug 2026"
        }
    ]);

    const hasPermission = (permission) => {
        return user?.permissions?.includes(permission);
    };
    const handleLogin = async (e) => {
    e.preventDefault();

    try {
        setLoggingIn(true);
        setLoginError("");

        const response = await fetch(
            "https://custom-employee-portal-backend.onrender.com/api/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    login,
                    password
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Login failed"
            );
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem(
            "user",
            JSON.stringify(data.user)
        );

        setToken(data.token);
        setUser(data.user);
        setPassword("");

    } catch (error) {
        console.error(error);
        setLoginError(error.message);
    } finally {
        setLoggingIn(false);
    }
};

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                "https://custom-employee-portal-backend.onrender.com/api/zoho/people",
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to fetch employees"
                );
            }

            setEmployees(data.data?.data || []);
        } catch (error) {
            console.error(error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && hasPermission("zoho.people.access")) {
            fetchEmployees();
        }
    }, [token, user]);

    const fetchCRMLeads = async () => {
    try {
        setCrmLoading(true);
        setCrmError("");

        const response = await fetch(
            "https://custom-employee-portal-backend.onrender.com/api/zoho/crm",
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Failed to fetch CRM leads"
            );
        }

        setCrmLeads(data.data?.data || []);

    } catch (error) {
        console.error(error);
        setCrmError(error.message);
    } finally {
        setCrmLoading(false);
    }
};

    const handleLogout = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setToken("");
      setUser(null);
      setEmployees([]);
      setLogin("");
      setPassword("");
  };

    const departments = [
        "All",
        ...new Set(
            employees
                .map((employee) => employee.department)
                .filter(Boolean)
        )
    ];

    const filteredEmployees = employees.filter((employee) => {
        const fullName =
            `${employee.firstName || ""} ${employee.lastName || ""}`.toLowerCase();

        const searchText = search.toLowerCase();

        const matchesSearch =
            fullName.includes(searchText) ||
            (employee.employeeId || "")
                .toLowerCase()
                .includes(searchText) ||
            (employee.email || "")
                .toLowerCase()
                .includes(searchText);

        const matchesDepartment =
            department === "All" ||
            employee.department === department;

        return matchesSearch && matchesDepartment;
    });

    if (!token) {
    return (
        <div className="login-page">

            <div className="login-card">

                <div className="login-icon">
                    EP
                </div>

                <h1>Employee Portal</h1>

                <p>
                    Sign in to access your dashboard
                </p>

                <form onSubmit={handleLogin}>

                    <div className="form-group">
                        <label>
                            Username or Email
                        </label>

                        <input
                            type="text"
                            value={login}
                            onChange={(e) =>
                                setLogin(e.target.value)
                            }
                            placeholder="Enter username or email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            Password
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            placeholder="Enter password"
                            required
                        />
                    </div>

                    {loginError && (
                        <div className="login-error">
                            {loginError}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loggingIn}
                    >
                        {loggingIn
                            ? "Signing in..."
                            : "Sign In"}
                    </button>

                </form>

                <div className="login-footer">
                    Secure Employee Portal
                </div>

            </div>

        </div>
    );
}

    return (
        <div className="app-layout">

            <aside className="sidebar">

                <div className="brand">
                    <div className="brand-logo">
                        EP
                    </div>

                    <div>
                        <h2>Employee</h2>
                        <span>Portal</span>
                    </div>
                </div>

                <nav className="sidebar-nav">

    <div
    className={`nav-item ${
        activePage === "dashboard" ? "active" : ""
    }`}
    onClick={() => setActivePage("dashboard")}
>
    <span>▦</span>
    Dashboard
</div>

    {hasPermission("zoho.people.access") && (
    <div
        className={`nav-item ${
            activePage === "people" ? "active" : ""
        }`}
        onClick={() => setActivePage("people")}
    >
        <span>👥</span>
        Zoho People
    </div>
)}

    {hasPermission("zoho.crm.access") && (
    <div
        className={`nav-item ${
            activePage === "crm" ? "active" : ""
        }`}
        onClick={() => {
            setActivePage("crm");
            fetchCRMLeads();
        }}
    >
        <span>◉</span>
        Zoho CRM
    </div>
)}

    {hasPermission("zoho.desk.access") && (
    <div
        className={`nav-item ${
            activePage === "desk" ? "active" : ""
        }`}
        onClick={() => setActivePage("desk")}
    >
        <span>◌</span>
        Zoho Desk
    </div>
)}

{hasPermission("zoho.books.access") && (
    <div
        className={`nav-item ${
            activePage === "books" ? "active" : ""
        }`}
        onClick={() => setActivePage("books")}
    >
        <span>₹</span>
        Zoho Books
    </div>
)}

</nav>

                <div className="sidebar-bottom">

                    <div className="user-box">
                        <div className="user-avatar">
                            {(user?.username || "U")
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div>
                            <strong>
                                {user?.username || "User"}
                            </strong>

                            <span>
                                {user?.role || "Employee"}
                            </span>
                        </div>
                    </div>

                    <button
                        className="sidebar-logout"
                        onClick={handleLogout}
                    >
                        ↪ Logout
                    </button>

                </div>

            </aside>

            <main className="main-content">

                <header className="top-header">

                    <div>
                        <h1>Welcome, {user?.username}</h1>

                        <p>
                            {user?.role} Dashboard
                        </p>
                    </div>

                    <div className="zoho-badge">
    <span></span>
    {user?.role === "Admin"
        ? "Zoho Integrations Active"
        : `${user?.role || "User"} Service Connected`}
</div>

                </header>

                {(activePage === "dashboard" || activePage === "people") && (
                <section className="stats-grid">

                    <div className="stat-card">
                        <div className="stat-icon employees-icon">
                            👥
                        </div>

                        <div>
                            <span>Total Employees</span>
                            <strong>{employees.length}</strong>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon active-icon">
                            ✓
                        </div>

                        <div>
                            <span>Active Employees</span>
                            <strong>
                                {
                                    employees.filter(
                                        (employee) =>
                                            employee.employeeStatus ===
                                            "Active"
                                    ).length
                                }
                            </strong>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon department-icon">
                            🏢
                        </div>

                        <div>
                            <span>Departments</span>
                            <strong>
                                {departments.length - 1}
                            </strong>
                        </div>
                    </div>

                </section>
                )}

                {activePage === "crm" && hasPermission("zoho.crm.access") && (
    <section className="employees-section">

        <div className="section-header">
            <div>
                <h2>Zoho CRM Leads</h2>
                <p>Customer leads from Zoho CRM</p>
            </div>

            <div className="employee-total">
                {crmLeads.length} records
            </div>
        </div>

        {crmLoading && (
            <div className="loading">
                Loading CRM leads...
            </div>
        )}

        {crmError && (
            <div className="error">
                {crmError}
            </div>
        )}

        {!crmLoading && !crmError && (
            <div className="table-wrapper">

                <table>

                    <thead>
                        <tr>
                            <th>NAME</th>
                            <th>COMPANY</th>
                            <th>EMAIL</th>
                            <th>PHONE</th>
                            <th>STATUS</th>
                        </tr>
                    </thead>

                    <tbody>

                        {crmLeads.map((lead) => (
                            <tr key={lead.id}>

                                <td>
                                    <strong>
                                        {lead.Full_Name || "-"}
                                    </strong>
                                </td>

                                <td>
                                    {lead.Company || "-"}
                                </td>

                                <td>
                                    <span className="email">
                                        {lead.Email || "-"}
                                    </span>
                                </td>

                                <td>
                                    {lead.Phone || "-"}
                                </td>

                                <td>
                                    <span className="status-badge">
                                        <span></span>
                                        {lead.Lead_Status || "-"}
                                    </span>
                                </td>

                            </tr>
                        ))}

                    </tbody>

                </table>

                {crmLeads.length === 0 && (
                    <div className="no-results">
                        No CRM leads found
                    </div>
                )}

            </div>
        )}

    </section>
)}

                {activePage === "desk" && hasPermission("zoho.desk.access") && (
                    <section className="employees-section">

                        <div className="section-header">
                            <div>
                                <h2>Zoho Desk Tickets</h2>
                                <p>Customer support tickets from Zoho Desk</p>
                            </div>
                            <div className="employee-total">
                                {deskTickets.length} tickets
                            </div>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon employees-icon">🎫</div>
                                <div>
                                    <span>Total Tickets</span>
                                    <strong>{deskTickets.length}</strong>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon active-icon">●</div>
                                <div>
                                    <span>Open Tickets</span>
                                    <strong>
                                        {deskTickets.filter((ticket) => ticket.status === "Open").length}
                                    </strong>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon department-icon">✓</div>
                                <div>
                                    <span>Closed Tickets</span>
                                    <strong>
                                        {deskTickets.filter((ticket) => ticket.status === "Closed").length}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>TICKET</th>
                                        <th>SUBJECT</th>
                                        <th>CUSTOMER</th>
                                        <th>PRIORITY</th>
                                        <th>STATUS</th>
                                        <th>ASSIGNED TO</th>
                                        <th>CREATED</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deskTickets.map((ticket) => (
                                        <tr key={ticket.id}>
                                            <td><strong>{ticket.ticketNumber}</strong></td>
                                            <td>{ticket.subject}</td>
                                            <td>{ticket.customer}</td>
                                            <td>{ticket.priority}</td>
                                            <td>
                                                <span className="status-badge">
                                                    <span></span>
                                                    {ticket.status}
                                                </span>
                                            </td>
                                            <td>{ticket.agent}</td>
                                            <td>{ticket.created}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                    </section>
                )}

                {activePage === "books" && hasPermission("zoho.books.access") && (
                    <section className="employees-section">

                        <div className="section-header">
                            <div>
                                <h2>Zoho Books Invoices</h2>
                                <p>Invoice and payment information from Zoho Books</p>
                            </div>

                            <div className="employee-total">
                                {booksInvoices.length} invoices
                            </div>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon employees-icon">₹</div>
                                <div>
                                    <span>Total Invoices</span>
                                    <strong>{booksInvoices.length}</strong>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon active-icon">✓</div>
                                <div>
                                    <span>Paid Invoices</span>
                                    <strong>
                                        {booksInvoices.filter((invoice) => invoice.status === "Paid").length}
                                    </strong>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon department-icon">!</div>
                                <div>
                                    <span>Pending / Overdue</span>
                                    <strong>
                                        {booksInvoices.filter((invoice) => invoice.status !== "Paid").length}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>INVOICE</th>
                                        <th>CUSTOMER</th>
                                        <th>AMOUNT</th>
                                        <th>STATUS</th>
                                        <th>DATE</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {booksInvoices.map((invoice) => (
                                        <tr key={invoice.id}>
                                            <td>
                                                <strong>{invoice.invoiceNumber}</strong>
                                            </td>
                                            <td>{invoice.customer}</td>
                                            <td>{invoice.amount}</td>
                                            <td>
                                                <span className="status-badge">
                                                    <span></span>
                                                    {invoice.status}
                                                </span>
                                            </td>
                                            <td>{invoice.date}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                    </section>
                )}

                {(activePage === "dashboard" || activePage === "people") &&
    hasPermission("zoho.people.access") && (
                    <section className="employees-section">

                    <div className="section-header">

                        <div>
                            <h2>Employees</h2>
                            <p>
                                Employee information from Zoho People
                            </p>
                        </div>

                        <div className="employee-total">
                            {filteredEmployees.length} records
                        </div>

                    </div>

                    <div className="filters">

                        <div className="search-box">
                            <span>⌕</span>

                            <input
                                type="text"
                                placeholder="Search by name, ID or email..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                            />
                        </div>

                        <select
                            value={department}
                            onChange={(e) =>
                                setDepartment(e.target.value)
                            }
                        >
                            {departments.map((item) => (
                                <option
                                    key={item}
                                    value={item}
                                >
                                    {item === "All"
                                        ? "All Departments"
                                        : item}
                                </option>
                            ))}
                        </select>

                    </div>

                    {loading && (
                        <div className="loading">
                            Loading employees...
                        </div>
                    )}

                    {error && (
                        <div className="error">
                            {error}
                        </div>
                    )}

                    {!loading && !error && (
                        <div className="table-wrapper">

                            <table>

                                <thead>
                                    <tr>
                                        <th>EMPLOYEE</th>
                                        <th>EMAIL</th>
                                        <th>DEPARTMENT</th>
                                        <th>DESIGNATION</th>
                                        <th>TYPE</th>
                                        <th>STATUS</th>
                                        <th>JOINED</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {filteredEmployees.map(
                                        (employee) => {

                                            const name =
                                                `${employee.firstName || ""} ${employee.lastName || ""}`.trim();

                                            const initials =
                                                name
                                                    .split(" ")
                                                    .map(
                                                        (word) =>
                                                            word[0]
                                                    )
                                                    .join("")
                                                    .slice(0, 2)
                                                    .toUpperCase();

                                            return (
                                                <tr
                                                    key={
                                                        employee.employeeId
                                                    }
                                                >

                                                    <td>
                                                        <div className="employee-cell">

                                                            <div className="employee-avatar">
                                                                {initials}
                                                            </div>

                                                            <div>
                                                                <strong>
                                                                    {name ||
                                                                        "-"}
                                                                </strong>

                                                                <span>
                                                                    {
                                                                        employee.employeeId
                                                                    }
                                                                </span>
                                                            </div>

                                                        </div>
                                                    </td>

                                                    <td>
                                                        <span className="email">
                                                            {
                                                                employee.email
                                                            }
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span className="department">
                                                            {
                                                                employee.department ||
                                                                "-"
                                                            }
                                                        </span>
                                                    </td>

                                                    <td>
                                                        {
                                                            employee.designation ||
                                                            "-"
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            employee.employmentType ||
                                                            "-"
                                                        }
                                                    </td>

                                                    <td>
                                                        <span className="status-badge">
                                                            <span></span>
                                                            {
                                                                employee.employeeStatus ||
                                                                "-"
                                                            }
                                                        </span>
                                                    </td>

                                                    <td>
                                                        {
                                                            employee.dateOfJoining ||
                                                            "-"
                                                        }
                                                    </td>

                                                </tr>
                                            );
                                        }
                                    )}

                                </tbody>

                            </table>

                            {filteredEmployees.length === 0 && (
                                <div className="no-results">
                                    No employees found
                                </div>
                            )}

                        </div>
                    )}

                </section>

                )}
            </main>

        </div>
    );
}

export default App;