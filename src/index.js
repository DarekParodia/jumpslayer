const express = require('express')
const session = require('./session')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const path = require('path')
const fs = require('fs');
const { log } = require('console')

const app = express()
const port = 3000

const rootPath = path.join(__dirname, "..");
const shaderDir = path.join(__dirname, "..", "public", "shaders");
const modelDir = path.join(__dirname, "..", "public", "models");

app.set("view engine", "pug");
app.set("views", path.join(rootPath, "views"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session.middleware);
app.use('/css', express.static(rootPath + '/node_modules/bootstrap/dist/css'));
app.use('/js', express.static(rootPath + '/node_modules/bootstrap/dist/js'));
app.use('/', express.static(rootPath + '/public'));

// routing GET
app.get("/", (req, res) => {
    res.render("index", {
        user: {
            loggedIn: false,
        }
    });
});

app.get("/statistics", (req, res) => {
    res.render("statistics", {
        user: {
            loggedIn: false,
        }
    });
});

app.get("/chat", (req, res) => {
    res.render("chat", {
        user: {
            loggedIn: false,
        }
    });
});

app.get("/profile", (req, res) => {
    res.render("profile", {
        user: {
            loggedIn: false,
        }
    });
});

app.get("/login", (req, res) => {
    res.render("login", {
        user: {
            loggedIn: false,
        }
    });
});

app.get("/logout", (req, res) => {
    res.render("logout", {
        user: {
            loggedIn: false,
        }
    });
});

app.get("/signup", (req, res) => {
    // map known error codes to friendly messages
    const err = req.query.error;
    let errorMessage = null;
    if (err === 'invalid_input') {
        errorMessage = 'Invalid input. Make sure username and password are 3-20 characters and passwords match.';
    }

    res.render("signup", {
        user: {
            loggedIn: false,
        },
        error: errorMessage,
    });
});

// routing POST
app.post("/login", (req, res) => {
    // process login
    res.redirect("/");
});

app.post("/signup", (req, res) => {
    // process signup
    const { username, password, confirmPassword } = req.body;
    let valid = true;

    if (!username || !password || !confirmPassword) {
        valid = false;
    }

    if (password !== confirmPassword) {
        valid = false;
    }

    if (password.length < 3 || username.length < 3) {
        valid = false;
    }

    if (password.length > 50 || username.length > 50) {
        valid = false;
    }

    if (valid) {
        // TODO: Add user to database
        console.log("New user signup:", username);
        console.log("Password:", password);
        console.log("Confirm Password:", confirmPassword);
        res.redirect("/");
    } else {
        console.log("Invalid signup attempt");
        res.redirect("/signup?error=invalid_input");
    }
});

// api
app.get('/api/shaderlist', (req, res) => {
    // list all files in shaders directory
    fs.readdir(shaderDir, (err, files) => {
        if (err) {
            res.status(500).send('Error reading shader directory');
            return;
        }
        // filter only .vert and .frag files
        const shaderFiles = files.filter(file => file.endsWith('.vert') || file.endsWith('.frag'));
        res.json(shaderFiles);
    });
});

app.get('/api/modellist', (req, res) => {
    // list all files in shaders directory
    fs.readdir(modelDir, (err, files) => {
        if (err) {
            res.status(500).send('Error reading models directory');
            return;
        }
        // filter only .vert and .frag files
        const shaderFiles = files.filter(file => file.endsWith('.obj') || file.endsWith('.mtl'));
        res.json(shaderFiles);
    });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))