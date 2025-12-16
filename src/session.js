const SessionName = "jsg-ssid"
class Client {
    constructor() {
        this.id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        this.loggedIn = false;
        this.username = null;
        Clients.set(this.id, this);
        console.log("New Client Connected with session: ", this.id);
    }

    async setCookie(res, maxAge = null) {
        res.cookie(SessionName, this.id, { httpOnly: true, maxAge: maxAge ? maxAge : undefined }); // maxAge in milliseconds
    }
}

function middleware(req, res, next) {
    if (req.cookies && req.cookies[SessionName]) {
        const sessionID = req.cookies[SessionName];
        if (Clients.has(sessionID)) {
            req.client = Clients.get(sessionID);
            // console.log("Existing client with session ID:", sessionID);
        } else {
            req.client = new Client();
            req.client.setCookie(res);
        }
    } else {
        // generate a new session ID
        req.client = new Client();
        req.client.setCookie(res);
    }

    next()
}

function cleanupClient(sessionID) {
    if (Clients.has(sessionID)) {
        Clients.delete(sessionID);
        console.log("Client with session ID", sessionID, "has been cleaned up.");
    }
}

const Clients = new Map();

const session = {
    middleware: middleware,
    cleanupClient: cleanupClient,
    Client: Client,
    Clients: Clients,
    SessionName: SessionName
}

module.exports = session;