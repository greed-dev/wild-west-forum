const express = require('express');
const hbs = require('hbs');
const path = require('path')
const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

// Middleware
app.use(express.json());
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('home', { title: "Home" });
});

app.get('/register', (req, res) => {
    res.render('register', { title: "Register" });
})

app.get('/login', (req, res) => {
    res.render('login', { title: "Login" });
})

app.get('/comments', (req, res) => {
    res.render('comments', { title: "Comments" })
})

app.get('/comment/new', (req, res) => {
    res.render('new_comment', { title: "New Comment" })
})


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
