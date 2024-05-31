<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">
  <title>Project Documentation</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 20px;
    }

    h1,
    h2 {
      color: #333;
    }

    h2 {
      margin-top: 20px;
    }

    p {
      margin-bottom: 10px;
    }

    ul {
      list-style-type: disc;
      margin-bottom: 10px;
      margin-left: 20px;
    }

    code {
      background-color: #f4f4f4;
      padding: 5px;
      border-radius: 3px;
    }
  </style>
</head>

<body>
  <h1>Project Documentation</h1>

  <h2>Project Overview</h2>
  <p>This project is an E-ticketing fourth year University Of Malawi computer science web based application project built using Node.js and Express.js, designed to streamline E-ticketing collection process through user registrations, generating reports, and visualizing data through various charts. The project includes several features such as user authentication, Ussd integration, admin management, and dynamic data visualization.</p>

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

  <!-- Add more sections as needed -->

  <h2 id="dependencies">Dependencies</h2>
  <p>Express.js: Web framework</p>
  <p>bcrypt: Password hashing</p>
  <!-- Add more dependencies -->

  <h2 id="environment-variables">Environment Variables</h2>
  <p>The application uses the following environment variables:</p>
  <ul>
    <li>DB_DATABASE: Name of the database</li>
    <li>DB_USER: Database user</li>
    <!-- Add more environment variables -->
  </ul>

  <!-- Add more sections as needed -->

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
