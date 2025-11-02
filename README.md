# Wild West Forum

**COS 498 Server Side Web Development - Midterm Project**

A deliberately insecure web forum application built as an educational project to understand web vulnerabilities before implementing secure alternatives.

## Overview

Wild West Forum is an intentionally vulnerable web application that demonstrates common security pitfalls in web development. Users can create accounts, log in, and post comments in a forum-style interface. The application uses in-memory storage and implements intentionally weak security practices for pedagogical purposes.

**⚠️ WARNING:** This application is intentionally insecure and should never be used in production. It contains numerous security vulnerabilities including plaintext passwords, insecure session cookies, and lack of input validation.

## Features

-   **User Authentication**: Register and login with username/password
-   **Session Management**: Cookie-based sessions (intentionally insecure)
-   **Comment System**: Authenticated users can post and view comments
-   **Responsive UI**: Built with Handlebars templates and partials
-   **Dockerized**: Containerized architecture with nginx proxy and Node.js backend

## Technology Stack

-   **Runtime**: Node.js
-   **Web Framework**: Express 5.x
-   **Templating Engine**: Handlebars (hbs) with partials
-   **Session Management**: cookie-parser
-   **Reverse Proxy**: nginx
-   **Containerization**: Docker & Docker Compose
-   **Storage**: In-memory (no database)

## Project Structure

```
wild-west-forum/
├── backend/
│   ├── server.js           # Main Express application
│   ├── package.json        # Node.js dependencies
│   ├── Dockerfile          # Backend container configuration
│   ├── public/             # Static assets (CSS, images)
│   └── views/              # Handlebars templates
│       ├── partials/       # Reusable template components
│       ├── home.hbs
│       ├── login.hbs
│       ├── register.hbs
│       ├── comments.hbs
│       └── new_comment.hbs
├── proxy/
│   ├── Dockerfile          # nginx container configuration
│   └── default.conf        # nginx configuration
└── docker-compose.yml      # Container orchestration
```

## Run Instructions

### Prerequisites

-   Docker and Docker Compose installed
-   Node.js (for local development)

### Running with Docker (Recommended)

1. **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd wild-west-forum
    ```

2. **Build and start the containers:**

    ```bash
    docker-compose up --build
    ```

3. **Access the application:**

    - Open your browser and navigate to `http://localhost:80`

4. **Stop the containers:**
    ```bash
    docker-compose down
    ```

### Running Locally (Development)

1. **Navigate to the backend directory:**

    ```bash
    cd wild-west-forum/backend
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Start the server:**

    ```bash
    npm start
    ```

4. **Access the application:**
    - Open your browser and navigate to `http://localhost:3000`

## Available Routes

### GET Routes

-   `GET /` - Home page with navigation
-   `GET /register` - User registration form
-   `GET /login` - User login form
-   `GET /comments` - View all comments with authors
-   `GET /comment/new` - Create new comment form (requires authentication)

### POST Routes

-   `POST /register` - Create a new user account
-   `POST /login` - Authenticate and create session
-   `POST /logout` - Clear session and logout
-   `POST /comment` - Submit a new comment (requires authentication)

## Data Model (In-Memory)

### Users

```javascript
{
  username: string,
  password: string  // Stored in plaintext (intentionally insecure)
}
```

### Sessions

```javascript
{
  user: string,
  sessionId: string,
  expires: Date
}
```

### Comments

```javascript
{
  author: string,
  text: string,
  createdAt: Date
}
```

## Known Security Vulnerabilities

This application intentionally includes the following security issues for educational purposes:

-   **Plaintext Passwords**: No hashing or salting
-   **Insecure Session Cookies**: No signing, encryption, or secure flags
-   **No CSRF Protection**: Cross-site request forgery attacks possible
-   **XSS Vulnerabilities**: Potential for cross-site scripting
-   **No Input Validation**: User input not sanitized
-   **In-Memory Storage**: Data lost on server restart
-   **No Rate Limiting**: Vulnerable to brute force attacks

## Docker Architecture

The application uses a two-container architecture:

1. **nginx Proxy Container**: Handles static file serving and reverse proxy
2. **Node.js Backend Container**: Runs the Express application

Containers communicate via a Docker bridge network defined in `docker-compose.yml`.

## Development Notes

-   Session cookies expire after 1 hour
-   All data is stored in memory and will be lost when the server restarts
-   The application uses Handlebars partials for the header and footer
-   Custom Handlebars helper `formatDate` formats timestamps

## Course Information

-   **Course**: COS 498 - Server Side Web Development
-   **Assignment**: Midterm Project
