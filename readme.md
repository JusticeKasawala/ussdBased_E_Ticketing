<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">

 

</head>

<body>
  <h1>Project Documentation</h1>

  <h2>Project Overview</h2>
  <p>This project is an E-ticketing fourth year University Of Malawi computer science web-based application project built using Node.js and Express.js, designed to streamline E-ticketing collection process through user registrations, generating reports, and visualizing data through various charts. The project includes several features such as user authentication, Ussd integration, admin management, and dynamic data visualization.</p>

  <h2>Table of Contents</h2>
  <ul>
    <li><a href="#installation">Installation</a></li>
    <li><a href="#project-structure">Project Structure</a></li>
    <li><a href="#dependencies">Dependencies</a></li>
    <li><a href="#environment-variables">Environment Variables</a></li>
    <li><a href="#database-initialization">Database Initialization</a></li>
    <li><a href="#authentication">Authentication</a></li>
    <li><a href="#routes">Routes</a></li>
    <li><a href="#chart-data">Chart Data</a></li>
    <li><a href="#frontend-integration">Frontend Integration</a></li>
  </ul>

  <h2 id="installation">Installation</h2>
  <p>To set up the project, follow these steps:</p>
  <ol>
    <li>Clone the repository:</li>
  </ol>
  <code>git clone https://github.com/JusticeKasawala/ussdBased_E_Ticketing.git</code>
  <code>cd your-repository</code>
  <p>Install dependencies:</p>
  <code>npm install</code>
  <p>Set up environment variables:</p>
  <p>Create a .env file in the root directory and add the required environment variables (see Environment Variables).</p>
  <p>Run the application:</p>
  <code>npm start</code>

  <h2 id="dependencies">Dependencies</h2>
  <ul>
    <li>Express.js: Web framework</li>
    <li>bcrypt: Password hashing</li>
    <li>body-parser: Middleware to parse request bodies</li>
    <li>crypto: Module for generating secure random strings</li>
    <li>express-session: Session management</li>
    <li>fs: File system module</li>
    <li>http: HTTP server module</li>
    <li>nodemailer: Email sending</li>
    <li>pdfkit: PDF generation</li>
    <li>node-cron: Cron job scheduling</li>
    <li>socket.io: WebSocket implementation</li>
  </ul>

  <h2 id="environment-variables">Environment Variables</h2>
  <p>The application uses the following environment variables:</p>
  <ul>
    <li>DB_DATABASE: Name of the database</li>
    <li>DB_USER: Database user</li>
    <li>DB_PASSWORD: Database password</li>
    <li>DB_HOST: Database host</li>
    <li>DB_PORT: Database port</li>
  </ul>

  <h2 id="database-initialization">Database Initialization</h2>
  <p>The database is initialized by creating necessary tables and inserting default admin data. This is handled in initializeDatabase() which calls createTables(), hashAndInsert(), and addDefaultAdmin() functions.</p>

  <h2 id="authentication">Authentication</h2>
  <p><strong>Admin Authentication:</strong> Admins are authenticated via the /authenticate-admin endpoint. The provided email and PIN are verified against the stored hashed values in the database.</p>
  <p><strong>User Authentication:</strong> Users are authenticated via session management. The authenticate middleware ensures that users are logged in before accessing protected routes.</p>

  <h2 id="routes">Routes</h2>
  <p><strong>Public Routes:</strong></p>
  <ul>
    <li>/login: Renders the login page</li>
    <li>/signup: Renders the signup page</li>
    <li>/register: Renders the registration page</li>
  </ul>
  <p><strong>Protected Routes:</strong></p>
  <ul>
    <li>/profile: Renders the user profile page</li>
    <li>/users: Renders the users page</li>
    <li>/suboffice: Renders the suboffice page</li>
    <li>/report: Renders the report page</li>
    <li>/addVendor: Renders the add vendor page</li>
    <li>/data: Fetches markets and suboffices</li>
    <li>/customers-data: Fetches the user count</li>
    <li>/sales-data: Fetches total sales data</li>
    <li>/api/users: Fetches user details</li>
    <li>/search: Handles search requests for users by suboffice</li>
    <li>/chartData: Fetches data for charts</li>
    <li>/radarChartData: Fetches data for radar charts</li>
  </ul>

  <h2 id="chart-data">Chart Data</h2>
  <p>The application provides endpoints to fetch data for various charts:</p>
  <ul>
    <li>/chartData: Provides data for sales, tickets, and vendors charts</li>
    <li>/radarChartData: Provides data for radar charts showing ticket sales across different suboffices</li>
  </ul>

  <h2>Frontend Integration</h2>
  <p>To integrate the report viewing and downloading functionality into the frontend, use the following code snippet in your HTML file:</p>
  <pre><code>&lt;li class="nav-item"&gt;
    &lt;a class="nav-link collapsed" data-bs-target="#tables-nav" data-bs-toggle="collapse" href="#"&gt;
      &lt;i class="bi bi-layout-text-window-reverse"&gt;&lt;/i&gt;&lt;span&gt;Report&lt;/span&gt;&lt;i class="bi bi-chevron-down ms-auto"&gt;&lt;/i&gt;
    &lt;/a&gt;
    &lt;ul id="tables-nav" class="nav-content collapse " data-bs-parent="#sidebar-nav"&gt;
      &lt;li&gt;
        &lt;a href="statistics"&gt;
          &lt;i class="bi bi-circle"&gt;&lt;/i&gt;&lt;span&gt;View unpaid users&lt;/span&gt;
        &lt;/a&gt;
      &lt;/li&gt;
      &lt;li&gt;
        &lt;a href="/path-to-download-report"&gt;
          &lt;i class="bi bi-circle"&gt;&lt;/i&gt;&lt;span&gt;Download Report&lt;/span&gt;
        &lt;/a&gt;
      &lt;/li&gt;
    &lt;/ul&gt;
  &lt;/li&gt;&lt;!-- End Tables Nav --&gt;</code></pre>
  <p>Replace /path-to-download-report with the actual endpoint that handles the report generation and downloading.</p>

  <p>Hats off to Justice Gawani Kasawala, Gracious Ngonga, and Thokozani Mambere!</p>
</body>

</html>
