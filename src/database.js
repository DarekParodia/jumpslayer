const { MongoClient, ObjectId } = require('mongodb');

class Database {
    constructor() {
        this.client = null;
        this.db = null;
    }

    async connect(uri, dbName) {
        if (this.client) return this.client;
        this.client = new MongoClient(uri);
        await this.client.connect();
        console.log("Connected to MongoDB");
        this.db = this.client.db(dbName);
        return this.db;
    }

    async close() {
        if (this.client) {
            await this.client.close();
            this.client = null;
        }
    }

    // ─── helpers ───
    _ensureDb() {
        if (!this.db) throw new Error("Database not connected");
    }

    _id(id) {
        return ObjectId.isValid(id) ? new ObjectId(id) : id;
    }

    // ═══════════════════════════════════════════════
    // USERS
    // ═══════════════════════════════════════════════
    async getUserCollection() {
        this._ensureDb();
        return this.db.collection('users').find({}).toArray();
    }

    async getUserByUsername(username) {
        this._ensureDb();
        return this.db.collection('users').findOne({ username });
    }

    async getUserById(id) {
        this._ensureDb();
        return this.db.collection('users').findOne({ _id: this._id(id) });
    }

    async signupUser(username, password) {
        this._ensureDb();
        const users = this.db.collection('users');
        const existingUser = await users.findOne({ username });
        if (existingUser) {
            throw new Error("User already exists");
        }
        const result = await users.insertOne({
            username,
            password,
            kills: 0,
            deaths: 0,
            match: null,
            description: '',
            pfp_path: '',
            date: new Date()
        });
        return result;
    }

    async validateUser(username, password) {
        this._ensureDb();
        const user = await this.db.collection('users').findOne({ username, password });
        return user !== null;
    }

    async updateUserProfile(username, fields) {
        this._ensureDb();
        const allowed = ['description', 'pfp_path'];
        const update = {};
        for (const key of allowed) {
            if (fields[key] !== undefined) update[key] = fields[key];
        }
        return this.db.collection('users').updateOne({ username }, { $set: update });
    }

    async incrementUserStats(username, kills = 0, deaths = 0) {
        this._ensureDb();
        return this.db.collection('users').updateOne(
            { username },
            { $inc: { kills, deaths } }
        );
    }

    async getLeaderboard(limit = 20) {
        this._ensureDb();
        return this.db.collection('users')
            .find({}, { projection: { password: 0 } })
            .sort({ kills: -1 })
            .limit(limit)
            .toArray();
    }

    // ═══════════════════════════════════════════════
    // MESSAGES
    // ═══════════════════════════════════════════════
    async createMessage({ author, isPrivate, receiver, match, content }) {
        this._ensureDb();
        return this.db.collection('messages').insertOne({
            author,
            isPrivate: !!isPrivate,
            receiver: receiver || null,
            match: match || null,
            content,
            date: new Date()
        });
    }

    async getMessages(filter = {}, limit = 50) {
        this._ensureDb();
        return this.db.collection('messages')
            .find(filter)
            .sort({ date: -1 })
            .limit(limit)
            .toArray();
    }

    async getPublicMessages(limit = 50) {
        return this.getMessages({ isPrivate: false }, limit);
    }

    async getPrivateMessages(username, limit = 50) {
        return this.getMessages({
            isPrivate: true,
            $or: [{ author: username }, { receiver: username }]
        }, limit);
    }

    // ═══════════════════════════════════════════════
    // MATCHES
    // ═══════════════════════════════════════════════
    async createMatch({ host, displayName, maxPlayers }) {
        this._ensureDb();
        const result = await this.db.collection('matches').insertOne({
            isPlaying: true,
            host,
            displayName,
            maxPlayers: parseInt(maxPlayers) || 8,
            date: new Date()
        });
        return result;
    }

    async getMatch(id) {
        this._ensureDb();
        return this.db.collection('matches').findOne({ _id: this._id(id) });
    }

    async getMatches(filter = {}) {
        this._ensureDb();
        return this.db.collection('matches').find(filter).sort({ date: -1 }).toArray();
    }

    async getActiveMatches() {
        return this.getMatches({ isPlaying: true });
    }

    async endMatch(id) {
        this._ensureDb();
        return this.db.collection('matches').updateOne(
            { _id: this._id(id) },
            { $set: { isPlaying: false } }
        );
    }

    async deleteMatch(id) {
        this._ensureDb();
        await this.db.collection('match_statistics').deleteMany({ match: this._id(id).toString() });
        return this.db.collection('matches').deleteOne({ _id: this._id(id) });
    }

    // ═══════════════════════════════════════════════
    // MATCH STATISTICS
    // ═══════════════════════════════════════════════
    async createMatchStatistic({ match, user, kills, deaths, assists }) {
        this._ensureDb();
        const result = await this.db.collection('match_statistics').insertOne({
            match: match.toString(),
            user,
            kills: parseInt(kills) || 0,
            deaths: parseInt(deaths) || 0,
            assists: parseInt(assists) || 0,
            date: new Date()
        });

        // also update global user stats
        await this.incrementUserStats(user, parseInt(kills) || 0, parseInt(deaths) || 0);

        return result;
    }

    async getMatchStatistics(matchId) {
        this._ensureDb();
        return this.db.collection('match_statistics')
            .find({ match: matchId.toString() })
            .sort({ kills: -1 })
            .toArray();
    }

    async getUserMatchStatistics(username) {
        this._ensureDb();
        return this.db.collection('match_statistics')
            .find({ user: username })
            .sort({ date: -1 })
            .toArray();
    }

    async getAllMatchStatistics(limit = 100) {
        this._ensureDb();
        return this.db.collection('match_statistics')
            .find({})
            .sort({ date: -1 })
            .limit(limit)
            .toArray();
    }
}

const database = new Database();

module.exports = database;