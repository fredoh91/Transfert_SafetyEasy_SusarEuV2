const mysql = require('mysql2/promise');
require('dotenv').config();

let connection;

async function connect() {
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log('Connected to the database');
    } catch (error) {
        console.error('Error connecting to the database:', error);
        throw error;
    }
}

async function disconnect() {
    try {
        if (connection) {
            await connection.end();
            console.log('Disconnected from the database');
        }
    } catch (error) {
        console.error('Error disconnecting from the database:', error);
        throw error;
    }
}

module.exports = { connect, disconnect, connection };