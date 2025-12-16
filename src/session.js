const SesionName = "jsg-ssid"
class Client {
    constructor() {
        this.id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        this.loggedIn = false;
        Clients.set(this.id, this);
        console.log("New Client Connected with session: ", this.id);
    }
}

function middleware(req, res, next) {
    if (req.cookies && req.cookies[SesionName]) {
        const sessionID = req.cookies[SesionName];
        if (Clients.has(sessionID)) {
            req.client = Clients.get(sessionID);
            // console.log("Existing client with session ID:", sessionID);
        } else {
            req.client = new Client();
            res.cookie(SesionName, req.client.id, { httpOnly: true });
            // console.log("New client created for invalid session ID:", sessionID);
        }
    } else {
        // generate a new session ID
        req.client = new Client();
        res.cookie(SesionName, req.client.id, { httpOnly: true });
    }

    next()
}

const Clients = new Map();

const session = {
    middleware: middleware,
    Client: Client,
    Clients: Clients
}

module.exports = session;