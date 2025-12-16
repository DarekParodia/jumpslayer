const express = require('express')
const session = require('./session')
const database = require('./database')
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
    render(req, res, "index");
});

app.get("/statistics", (req, res) => {
    render(req, res, "statistics");
});

app.get("/chat", (req, res) => {
    render(req, res, "chat");
});

app.get("/profile", (req, res) => {
    render(req, res, "profile");
});

app.get("/login", (req, res) => {
    render(req, res, "login");
});

app.get("/logout", (req, res) => {
    session.cleanupClient(req.client.id);
    res.clearCookie(session.SessionName);
    res.redirect("/");
});

app.get("/signup", (req, res) => {
    // map known error codes to friendly messages
    const err = req.query.error;
    let errorMessage = null;
    if (err === 'invalid_input') {
        errorMessage = 'Invalid input. Make sure username and password are 3-20 characters and passwords match.';
    }

    render(req, res, "signup", { errorMessage: errorMessage });
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
        database.signupUser(username, password).then(() => {
            console.log("Successful signup for user:", username);

            session.Clients.get(req.client.id).loggedIn = true;
            session.Clients.get(req.client.id).username = username;

            res.redirect("/");
        }).catch(err => {
            console.log("Error during signup for user:", username, err);
            res.redirect("/signup?error=invalid_input");
        });
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



database.connect('mongodb://localhost:27017', 'jumpslayer').finally(() => {
    app.listen(port, async () => {
        console.log(`Example app listening on port ${port}!`)
        console.log((await database.getUserCollection()).length, "users in database");
    })
}).catch(err => {
    console.error("Failed to connect to database on startup:", err);
});

function render(req, res, view, customData = {}) {
    res.render(view, {
        user: {
            loggedIn: req.client.loggedIn,
        },
        ...customData
    });
}