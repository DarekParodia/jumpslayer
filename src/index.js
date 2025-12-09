const express = require('express')
const session = require('./session')
const path = require('path')
const fs = require('fs');

const app = express()
const port = 3000

const rootPath = path.join(__dirname, "..");
const shaderDir = path.join(__dirname, "..", "public", "shaders");
const modelDir = path.join(__dirname, "..", "public", "models");

app.set("view engine", "pug");
app.set("views", path.join(rootPath, "views"));

app.use(session.default.middleware);
app.use('/css', express.static(rootPath + '/node_modules/bootstrap/dist/css'));
app.use('/js', express.static(rootPath + '/node_modules/bootstrap/dist/js'));
app.use('/', express.static(rootPath + '/public'));

// routing
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
    res.render("signup", {
        user: {
            loggedIn: false,
        }
    });
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