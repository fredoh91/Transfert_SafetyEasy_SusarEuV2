const { connection } = require('./db');

async function insertSusarData(data) {
    try {
        await connection.execute('INSERT INTO susar (column1, column2, ...) VALUES (?, ?, ...)', [data.column1, data.column2, ...]);
    } catch (error) {
        console.error('Error inserting data into susar table:', error);
        throw error;
    }
}

async function insertProductData(data) {
    try {
        await connection.execute('INSERT INTO produit (column1, column2, ...) VALUES (?, ?, ...)', [data.column1, data.column2, ...]);
    } catch (error) {
        console.error('Error inserting data into produit table:', error);
        throw error;
    }
}

async function insertPtData(data) {
    try {
        await connection.execute('INSERT INTO pt (column1, column2, ...) VALUES (?, ?, ...)', [data.column1, data.column2, ...]);
    } catch (error) {
        console.error('Error inserting data into pt table:', error);
        throw error;
    }
}

module.exports = { insertSusarData, insertProductData, insertPtData };