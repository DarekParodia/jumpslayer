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

// ─── helper: require login ───
function requireLogin(req, res) {
    if (!req.client.loggedIn) {
        res.redirect('/login');
        return true;
    }
    return false;
}

// ═══════════════════════════════════════════════
// GET ROUTES
// ═══════════════════════════════════════════════

app.get("/", (req, res) => {
    render(req, res, "index");
});

app.get("/statistics", async (req, res) => {
    try {
        const leaderboard = await database.getLeaderboard(20);
        const recentStats = await database.getAllMatchStatistics(20);

        // resolve match names for recent stats
        for (const stat of recentStats) {
            const match = await database.getMatch(stat.match);
            stat.matchName = match ? match.displayName : 'Nieznana';
        }

        render(req, res, "statistics", { leaderboard, recentStats });
    } catch (e) {
        console.error("Error loading statistics:", e);
        render(req, res, "statistics", { leaderboard: [], recentStats: [] });
    }
});

app.get("/chat", async (req, res) => {
    try {
        const messages = await database.getPublicMessages(50);
        // reverse so oldest first for display
        messages.reverse();
        render(req, res, "chat", { messages });
    } catch (e) {
        console.error("Error loading chat:", e);
        render(req, res, "chat", { messages: [] });
    }
});

app.get("/profile", async (req, res) => {
    if (requireLogin(req, res)) return;
    try {
        const userDoc = await database.getUserByUsername(req.client.username);
        const matchStats = await database.getUserMatchStatistics(req.client.username);

        // resolve match names
        for (const stat of matchStats) {
            const match = await database.getMatch(stat.match);
            stat.matchName = match ? match.displayName : 'Nieznana';
        }

        render(req, res, "profile", { profile: userDoc, matchStats });
    } catch (e) {
        console.error("Error loading profile:", e);
        render(req, res, "profile", { profile: null, matchStats: [] });
    }
});

app.get("/profile/:username", async (req, res) => {
    try {
        const userDoc = await database.getUserByUsername(req.params.username);
        if (!userDoc) {
            return res.status(404).send("Użytkownik nie znaleziony");
        }
        const matchStats = await database.getUserMatchStatistics(req.params.username);

        for (const stat of matchStats) {
            const match = await database.getMatch(stat.match);
            stat.matchName = match ? match.displayName : 'Nieznana';
        }

        render(req, res, "profile", { profile: userDoc, matchStats });
    } catch (e) {
        console.error("Error loading profile:", e);
        render(req, res, "profile", { profile: null, matchStats: [] });
    }
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
    const err = req.query.error;
    let errorMessage = null;
    if (err === 'invalid_input') {
        errorMessage = 'Niepoprawne dane. Upewnij się że nazwa i hasło mają 3-20 znaków i hasła są takie same.';
    }
    render(req, res, "signup", { errorMessage: errorMessage });
});

// ─── Matches ───
app.get("/matches", async (req, res) => {
    try {
        const matches = await database.getMatches();
        render(req, res, "matches", { matches });
    } catch (e) {
        console.error("Error loading matches:", e);
        render(req, res, "matches", { matches: [] });
    }
});

app.get("/matches/:id", async (req, res) => {
    try {
        const match = await database.getMatch(req.params.id);
        if (!match) return res.status(404).send("Rozgrywka nie znaleziona");
        const stats = await database.getMatchStatistics(req.params.id);
        render(req, res, "match_detail", { match, stats });
    } catch (e) {
        console.error("Error loading match:", e);
        res.status(500).send("Błąd serwera");
    }
});

// ═══════════════════════════════════════════════
// POST ROUTES
// ═══════════════════════════════════════════════

app.post("/login", async (req, res) => {
    const { username, password, remember } = req.body;
    let valid = true;

    if (!username || !password) {
        valid = false;
    }
    if (valid) {
        await database.validateUser(username, password).then(isValid => {
            if (isValid) {
                console.log("Successful login for user:", username);

                session.Clients.get(req.client.id).loggedIn = true;
                session.Clients.get(req.client.id).username = username;

                if (remember) {
                    req.client.setCookie(res, 365 * 24 * 60 * 60 * 1000);
                }

                res.redirect("/");
            } else {
                console.log("Invalid login attempt for user:", username);
                res.redirect("/login?error=invalid_input");
            }
        }).catch(err => {
            console.log("Error during login for user:", username, err);
            res.redirect("/login?error=invalid_input");
        });
    } else {
        console.log("Invalid login attempt");
        res.redirect("/login?error=invalid_input");
    }
});

app.post("/signup", (req, res) => {
    const { username, password, confirmPassword } = req.body;
    let valid = true;

    if (!username || !password || !confirmPassword) valid = false;
    if (password !== confirmPassword) valid = false;
    if (password.length < 3 || username.length < 3) valid = false;
    if (password.length > 50 || username.length > 50) valid = false;

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

// ─── Profile update ───
app.post("/profile/update", async (req, res) => {
    if (requireLogin(req, res)) return;
    try {
        const { description } = req.body;
        await database.updateUserProfile(req.client.username, { description });
        res.redirect("/profile");
    } catch (e) {
        console.error("Error updating profile:", e);
        res.redirect("/profile");
    }
});

// ─── Chat message ───
app.post("/chat/send", async (req, res) => {
    if (requireLogin(req, res)) return;
    try {
        const { content } = req.body;
        if (content && content.trim().length > 0) {
            await database.createMessage({
                author: req.client.username,
                isPrivate: false,
                receiver: null,
                match: null,
                content: content.trim()
            });
        }
        res.redirect("/chat");
    } catch (e) {
        console.error("Error sending message:", e);
        res.redirect("/chat");
    }
});

// ─── Match management ───
app.post("/matches/create", async (req, res) => {
    if (requireLogin(req, res)) return;
    try {
        const { displayName, maxPlayers } = req.body;
        if (!displayName || displayName.trim().length === 0) {
            return res.redirect("/matches");
        }
        await database.createMatch({
            host: req.client.username,
            displayName: displayName.trim(),
            maxPlayers: maxPlayers || 8
        });
        res.redirect("/matches");
    } catch (e) {
        console.error("Error creating match:", e);
        res.redirect("/matches");
    }
});

app.post("/matches/:id/end", async (req, res) => {
    if (requireLogin(req, res)) return;
    try {
        await database.endMatch(req.params.id);
        res.redirect("/matches/" + req.params.id);
    } catch (e) {
        console.error("Error ending match:", e);
        res.redirect("/matches");
    }
});

app.post("/matches/:id/delete", async (req, res) => {
    if (requireLogin(req, res)) return;
    try {
        await database.deleteMatch(req.params.id);
        res.redirect("/matches");
    } catch (e) {
        console.error("Error deleting match:", e);
        res.redirect("/matches");
    }
});

// ─── Match Statistics (artificial creation) ───
app.post("/matches/:id/stats", async (req, res) => {
    if (requireLogin(req, res)) return;
    try {
        const { user, kills, deaths, assists } = req.body;
        if (!user || user.trim().length === 0) {
            return res.redirect("/matches/" + req.params.id);
        }
        // Verify user exists
        const userDoc = await database.getUserByUsername(user.trim());
        if (!userDoc) {
            return res.redirect("/matches/" + req.params.id + "?error=user_not_found");
        }
        await database.createMatchStatistic({
            match: req.params.id,
            user: user.trim(),
            kills: kills || 0,
            deaths: deaths || 0,
            assists: assists || 0
        });
        res.redirect("/matches/" + req.params.id);
    } catch (e) {
        console.error("Error adding match stat:", e);
        res.redirect("/matches/" + req.params.id);
    }
});

// ═══════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════

app.get('/api/shaderlist', (req, res) => {
    fs.readdir(shaderDir, (err, files) => {
        if (err) {
            res.status(500).send('Error reading shader directory');
            return;
        }
        const shaderFiles = files.filter(file => file.endsWith('.vert') || file.endsWith('.frag'));
        res.json(shaderFiles);
    });
});

app.get('/api/modellist', (req, res) => {
    fs.readdir(modelDir, (err, files) => {
        if (err) {
            res.status(500).send('Error reading models directory');
            return;
        }
        const shaderFiles = files.filter(file => file.endsWith('.obj') || file.endsWith('.mtl'));
        res.json(shaderFiles);
    });
});

// ═══════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════

database.connect('mongodb://localhost:27017', 'jumpslayer').finally(() => {
    app.listen(port, async () => {
        console.log(`Jumpslayer listening on port ${port}!`)
        console.log((await database.getUserCollection()).length, "users in database");
    })
}).catch(err => {
    console.error("Failed to connect to database on startup:", err);
});

function render(req, res, view, customData = {}) {
    res.render(view, {
        user: {
            loggedIn: req.client.loggedIn,
            username: req.client.username
        },
        ...customData
    });
}