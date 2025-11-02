const hbs = require('hbs');
const path = require('path')
const express = require('express');
const cookieParser = require('cookie-parser')

const app = express();
const PORT = process.env.PORT || 3000;

const users = {};
const sessions = {};
const comments = [];

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

hbs.registerHelper('formatDate', function(date) {
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour : 'numeric',
        minute: '2-digit'
    })
})

app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
    const sessionId = req.cookies.sessionId;

    if (sessionId && sessions[sessionId]) {
        const session = sessions[sessionId];

        if (session.expires > new Date()) {
            req.user = session.user;
        }

    }

    next()
})

let sessionCounter = 0;

function createSession(username) {
    const sessionId = sessionCounter.toString();
    sessions[sessionId] = {
        user: username,
        sessionId: sessionId,
        expires: new Date(Date.now() + 3600000)
    };

    sessionCounter++;
    return sessionId;
}

app.get('/', (req, res) => {
    res.render('home', { title: "Home", user: req.user || null, year: new Date().getFullYear() });
});

app.get('/register', (req, res) => {
    res.render('register', { title: "Register", user: req.user || null, year: new Date().getFullYear() });
})

app.get('/login', (req, res) => {
    res.render('login', { title: "Login", user: req.user || null, year: new Date().getFullYear() });
})

app.get('/comments', (req, res) => {
    res.render('comments', { title: "Comments", user: req.user || null, year: new Date().getFullYear(), comments: comments })
})

app.get('/comment/new', (req, res) => {
    res.render('new_comment', { title: "Post Comment", user: req.user || null, year: new Date().getFullYear() })
})

app.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (users[username]) {
        return res.render('register', {
            title: "Register",
            error: "Username already taken"
        })
    }

    const sessionId = createSession(username);
    users[username] = {username, password}

    res.cookie('sessionId', sessionId)
    res.redirect('/comments')
})

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!users[username] || users[username].password != password) {
        return res.render('login', {
            title: "Login",
            error: "Invalid username or password"
        });
    }

    const sessionId = createSession(username);
    res.cookie('sessionId', sessionId);

    res.redirect('/comments')
})

app.post('/logout', (req, res) => {
    const sessionId = req.cookies.sessionId;

    if (sessionId) {
        delete sessions[sessionId]
    }

    res.clearCookie("sessionId")
    res.redirect("/")
})

app.post('/comment', (req, res) => {
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
