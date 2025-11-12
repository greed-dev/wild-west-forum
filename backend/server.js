/**
 * Wild West Forum - Intentionally Insecure Web Application
 *
 * SECURITY WARNING: This application contains deliberate security vulnerabilities
 * for educational purposes. DO NOT use this code in production environments.
 *
 * Key vulnerabilities demonstrated:
 * - Plaintext password storage
 * - Insecure session management (predictable session IDs)
 * - No CSRF protection
 * - Missing input validation/sanitization
 * - Potential XSS vulnerabilities
 * - Lack of secure cookie flags (httpOnly, secure, sameSite)
 * - No rate limiting on authentication endpoints
 */

const hbs = require('hbs');
const path = require('path')
const express = require('express');
const cookieParser = require('cookie-parser')

const app = express();
const PORT = process.env.PORT || 3000;

// VULNERABILITY: In-memory storage - all data lost on server restart
// users object structure: { username: { username: string, password: string (plaintext!) } }
const users = {};

// VULNERABILITY: Insecure session storage with predictable session IDs
// sessions object structure: { sessionId: { user: string, sessionId: string, expires: Date } }
const sessions = {};

// comments array structure: [{ author: string, text: string, createdAt: Date }]
const comments = [];

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Register Handlebars partials (reusable template components like header/footer)
hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

// Custom Handlebars helper to format dates in a user-friendly format
// Used in templates to display comment timestamps (e.g., "Nov 2, 2025, 3:45 PM")
hbs.registerHelper('formatDate', function(date) {
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour : 'numeric',
        minute: '2-digit'
    })
})

// Parse JSON request bodies
app.use(express.json());

// VULNERABILITY: Cookie parser without secret - cookies are not signed or encrypted
// In production, use: cookieParser('your-secret-key')
app.use(cookieParser());

// Serve static files (CSS, images) from public directory
app.use(express.static('public'))

// Parse URL-encoded form data (from HTML forms)
app.use(express.urlencoded({ extended: true }));

// Session authentication middleware - runs on every request
// Checks if the user has a valid session cookie and attaches user info to req.user
app.use((req, _res, next) => {
    // VULNERABILITY: Unsigned, unencrypted cookies - can be forged or tampered with
    const sessionId = req.cookies.sessionId;

    // Check if session exists in our in-memory store
    if (sessionId && sessions[sessionId]) {
        const session = sessions[sessionId];

        // Only set req.user if session hasn't expired
        // VULNERABILITY: No session refresh mechanism - sessions expire after 1 hour regardless of activity
        if (session.expires > new Date()) {
            req.user = session.user;
        }
        // NOTE: Expired sessions are not cleaned up from memory (memory leak)
    }

    next()
})

// CRITICAL VULNERABILITY: Predictable sequential session IDs
// Attacker can enumerate sessions (0, 1, 2, 3...) to hijack other users' sessions
// In production, use cryptographically secure random tokens (e.g., crypto.randomBytes())
let sessionCounter = 0;

/**
 * Creates a new user session with predictable session ID
 *
 * VULNERABILITY DETAILS:
 * 1. Sequential session IDs (0, 1, 2...) - trivially predictable
 * 2. No cryptographic randomness
 * 3. Session fixation vulnerability - session ID chosen before authentication
 * 4. No session rotation after privilege changes
 *
 * SECURE ALTERNATIVE:
 * - Use crypto.randomBytes(32).toString('hex') for session IDs
 * - Implement session rotation after login
 * - Add rate limiting to prevent session enumeration attacks
 *
 * @param {string} username - The username to associate with the session
 * @returns {string} The sequential session ID
 */
function createSession(username) {
    const sessionId = sessionCounter.toString();
    sessions[sessionId] = {
        user: username,
        sessionId: sessionId,
        expires: new Date(Date.now() + 3600000) // 1 hour expiration
    };

    sessionCounter++;
    return sessionId;
}

// Home page - public route, no authentication required
app.get('/', (req, res) => {
    res.render('home', { title: "Home", user: req.user || null, year: new Date().getFullYear() });
});

// Registration form - public route
app.get('/register', (req, res) => {
    res.render('register', { title: "Register", user: req.user || null, year: new Date().getFullYear() });
})

// Login form - public route
app.get('/login', (req, res) => {
    res.render('login', { title: "Login", user: req.user || null, year: new Date().getFullYear() });
})

// Display all comments in reverse chronological order (newest first)
// VULNERABILITY: No pagination - could cause performance issues with many comments
app.get('/comments', (req, res) => {
    res.render('comments', { title: "Comments", user: req.user || null, year: new Date().getFullYear(), comments: comments.slice().reverse() })
})

// Comment creation form - accessible by all, but posting requires authentication
app.get('/comment/new', (req, res) => {
    res.render('new_comment', { title: "Post Comment", user: req.user || null, year: new Date().getFullYear() })
})

// User registration endpoint
app.post('/register', (req, res) => {
    // VULNERABILITY: No input validation - accepts empty strings, special characters, etc.
    // VULNERABILITY: No length limits on username or password
    const { username, password } = req.body;

    // Basic duplicate username check
    // VULNERABILITY: Case-sensitive - "User" and "user" are treated as different accounts
    if (users[username]) {
        return res.render('register', {
            title: "Register",
            error: "Username already taken"
        })
    }

    // VULNERABILITY: Automatic login after registration without email verification
    // Allows unlimited account creation for spam/abuse
    const sessionId = createSession(username);

    // CRITICAL VULNERABILITY: Plaintext password storage
    // Passwords should be hashed with bcrypt, scrypt, or Argon2
    users[username] = {username, password}

    // VULNERABILITY: Cookie without secure flags (httpOnly, secure, sameSite)
    // Cookie is vulnerable to XSS attacks and can be accessed by JavaScript
    // Should be: res.cookie('sessionId', sessionId, { httpOnly: true, secure: true, sameSite: 'strict' })
    res.cookie('sessionId', sessionId)
    res.redirect('/comments')
})

// User login endpoint
app.post('/login', (req, res) => {
    // VULNERABILITY: No input validation or sanitization
    const { username, password } = req.body;

    // VULNERABILITY: Plaintext password comparison - no hashing
    // VULNERABILITY: Timing attack - different response times for invalid username vs invalid password
    // VULNERABILITY: No rate limiting - vulnerable to brute force attacks
    if (!users[username] || users[username].password != password) {
        return res.render('login', {
            title: "Login",
            error: "Invalid username or password"
        });
    }

    // VULNERABILITY: No invalidation of old sessions
    // Multiple sessions for same user can exist simultaneously
    const sessionId = createSession(username);

    // VULNERABILITY: Insecure cookie - no httpOnly, secure, or sameSite flags
    res.cookie('sessionId', sessionId);
    res.redirect('/comments')
})

// User logout endpoint
app.post('/logout', (req, res) => {
    const sessionId = req.cookies.sessionId;

    // Clean up server-side session
    if (sessionId) {
        delete sessions[sessionId]
    }

    // Clear client-side cookie
    res.clearCookie("sessionId")

    // VULNERABILITY: No CSRF protection - attacker could log users out
    res.redirect("/")
})

app.post('/comment', (req, res) => {
    // VULNERABILITY: No input validation on comment text
    // - No length limits (could store very large comments)
    // - No content sanitization (malicious scripts can be injected)
    const text = req.body.text;

    // Get authenticated user from session middleware
    const author = req.user;

    // Basic authentication check - redirect to login if not authenticated
    // GOOD PRACTICE: Authentication requirement before posting
    if (!author) {
        return res.redirect('/login');
    }

    // VULNERABILITY: No XSS escaping if template uses triple-braces {{{text}}}
    // Handlebars auto-escapes by default with {{text}}, but triple-braces bypass this
    // Malicious comment like "<script>alert('XSS')</script>" could execute in browsers
    // VULNERABILITY: No CSRF token validation - cross-site request forgery possible
    comments.push({
        author: author,
        text: text,
        createdAt: new Date()
    });

    res.redirect('/comments');
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
