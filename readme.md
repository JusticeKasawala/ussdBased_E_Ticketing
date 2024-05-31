# Project Documentation

## Project Overview

This project is an E-ticketing fourth year computer science  web application project built using Node.js and Express.js, designed to streamline E-ticketing collection process through  user registrations, generating reports, and visualizing data through various charts. The project includes several features such as user authentication,Ussd integration, admin management, and dynamic data visualization.

## Table of Contents

1. [Installation](#installation)
2. [Project Structure](#project-structure)
3. [Dependencies](#dependencies)
4. [Environment Variables](#environment-variables)
5. [Database Initialization](#database-initialization)
6. [Authentication](#authentication)
7. [Routes](#routes)
8. [Chart Data](#chart-data)
9. [Frontend Integration](#frontend-integration)

## Installation

To set up the project, follow these steps:

1. **Clone the repository:**
   
   git clone https://github.com/JusticeKasawala/ussdBased_E_Ticketing.git
   cd your-repository
Install dependencies:


npm install
Set up environment variables:
Create a .env file in the root directory and add the required environment variables (see Environment Variables).

Run the application:


npm start
Project Structure

|-- project-root
    |-- assets
    |-- db
    |   |-- migrate.js
    |   |-- db.js
    |-- views
    |   |-- login.ejs
    |   |-- index.ejs
    |   |-- signup.ejs
    |   |-- register.ejs
    |   |-- profile.ejs
    |   |-- users.ejs
    |   |-- suboffice.ejs
    |   |-- report.ejs
    |   |-- addVendor.ejs
    |-- ussdRouter.js
    |-- payment.js
    |-- logger.js
    |-- server.js
Dependencies
Express.js: Web framework
bcrypt: Password hashing
body-parser: Middleware to parse request bodies
crypto: Module for generating secure random strings
express-session: Session management
fs: File system module
http: HTTP server module
nodemailer: Email sending
pdfkit: PDF generation
node-cron: Cron job scheduling
socket.io: WebSocket implementation
Environment Variables
The application uses the following environment variables:

DB_DATABASE: Name of the database
DB_USER: Database user
DB_PASSWORD: Database password
DB_HOST: Database host
DB_PORT: Database port
Database Initialization
The database is initialized by creating necessary tables and inserting default admin data. This is handled in initializeDatabase() which calls createTables(), hashAndInsert(), and addDefaultAdmin() functions.

Authentication
Admin Authentication
Admins are authenticated via the /authenticate-admin endpoint. The provided email and PIN are verified against the stored hashed values in the database.

User Authentication
Users are authenticated via session management. The authenticate middleware ensures that users are logged in before accessing protected routes.

Routes
Public Routes
/login: Renders the login page
/signup: Renders the signup page
/register: Renders the registration page
Protected Routes
/profile: Renders the user profile page
/users: Renders the users page
/suboffice: Renders the suboffice page
/report: Renders the report page
/addVendor: Renders the add vendor page
/data: Fetches markets and suboffices
/customers-data: Fetches the user count
/sales-data: Fetches total sales data
/api/users: Fetches user details
/search: Handles search requests for users by suboffice
/chartData: Fetches data for charts
/radarChartData: Fetches data for radar charts
Chart Data
The application provides endpoints to fetch data for various charts. These include:

/chartData: Provides data for sales, tickets, and vendors charts.
/radarChartData: Provides data for radar charts showing ticket sales across different suboffices.
Frontend Integration
To integrate the report viewing and downloading functionality into the frontend, use the following code snippet in your HTML file:

html

<li class="nav-item">
    <a class="nav-link collapsed" data-bs-target="#tables-nav" data-bs-toggle="collapse" href="#">
      <i class="bi bi-layout-text-window-reverse"></i><span>Report</span><i class="bi bi-chevron-down ms-auto"></i>
    </a>
    <ul id="tables-nav" class="nav-content collapse " data-bs-parent="#sidebar-nav">
      <li>
        <a href="statistics">
          <i class="bi bi-circle"></i><span>View unpaid users</span>
        </a>
      </li>
      <li>
        <a href="/path-to-download-report">
          <i class="bi bi-circle"></i><span>Download Report</span>
        </a>
      </li>
    </ul>
</li><!-- End Tables Nav -->
Replace /path-to-download-report with the actual endpoint that handles the report generation and downloading.

hats off to Justice Gawani Kasawala,Gracious Ngonga and Thokozani Mambere