const { MongoClient } = require('mongodb');

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

    async getUserCollection() {
        if (!this.db) {
            throw new Error("Database not connected");
        }
        return this.db.collection('users').find({}).toArray();
    }

    async signupUser(username, password) {
        if (!this.db) {
            throw new Error("Database not connected");
        }
        const users = this.db.collection('users');
        const existingUser = await users.findOne({ username: username });
        if (existingUser) {
            throw new Error("User already exists");
        }
        await users.insertOne({ username: username, password: password });
        return true;
    }

    async validateUser(username, password) {
        if (!this.db) {
            throw new Error("Database not connected");
        }
        const users = this.db.collection('users');
        const user = await users.findOne({ username: username, password: password });
        return user !== null;
    }
}

const database = new Database();

module.exports = database;