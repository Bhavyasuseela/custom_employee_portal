# Custom Employee Portal

A full-stack employee management portal built using React, Node.js, Express, PostgreSQL, JWT authentication, Role-Based Access Control (RBAC), and Zoho integrations.

## Project Overview

The Custom Employee Portal provides a centralized platform for managing employees and accessing different business services based on user roles and permissions.

The application includes:

- Secure user authentication
- JWT-based authorization
- Role-Based Access Control (RBAC)
- Employee management
- Zoho People integration
- Zoho CRM integration
- Zoho Desk demonstration module
- Zoho Books demonstration module
- PostgreSQL database
- Permission-based service access

## Technologies Used

### Frontend
- React
- Vite
- JavaScript
- CSS

### Backend
- Node.js
- Express.js
- PostgreSQL
- JWT
- bcryptjs

### Integrations
- Zoho People
- Zoho CRM
- Zoho Desk
- Zoho Books

## System Architecture

```text
User
  |
  v
React Frontend
  |
  v
Node.js + Express Backend
  |
  +---- PostgreSQL Database
  |
  +---- JWT Authentication
  |
  +---- Role-Based Access Control
  |
  +---- Zoho People
  |
  +---- Zoho CRM
  |
  +---- Zoho Desk
  |
  +---- Zoho Books
