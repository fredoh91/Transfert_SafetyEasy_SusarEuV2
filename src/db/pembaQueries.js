const { connection } = require('./db');

async function getProducts(substanceName) {
    try {
        const [rows, fields] = await connection.execute('SELECT * FROM pemba_table WHERE substance_name = ?', [substanceName]);
        return rows;
    } catch (error) {
        console.error('Error executing query to retrieve products:', error);
        throw error;
    }
}

module.exports = { getProducts };