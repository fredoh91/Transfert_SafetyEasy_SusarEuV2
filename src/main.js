// ```javascript
const { connect, disconnect } = require('./db');
const { getProducts } = require('./pembaQueries');
const { insertSusarData, insertProductData, insertPtData } = require('./susarEuQueries');
require('dotenv').config();

async function transferData() {
    await connect();

    try {
        // Fetch data from lst_produits table
        const products = await getProducts();

        for (const product of products) {
            // Start transaction
            await connection.beginTransaction();

            // Insert data into susar table
            const susarId = await insertSusarData(product);

            // Insert data into produit table
            await insertProductData({ susarId, ...product });

            // Insert data into pt table
            await insertPtData({ susarId, ...product });

            // Commit transaction
            await connection.commit();
        }
    } catch (error) {
        // Rollback transaction in case of error
        await connection.rollback();
        console.error('Error transferring data:', error);
    } finally {
        await disconnect();
    }
}

transferData().catch(error => console.error('Error:', error));

// 

// const { connect, disconnect } = require('./db');
// const { getProducts } = require('./pembaQueries');
// const { insertSusarData, insertProductData, insertPtData } = require('./susarEuQueries');
// require('dotenv').config();

// async function transferData() {
//     try {
//         await connect();

//         // Fetch data from lst_produits table
//         const products = await getProducts();

//         for (const product of products) {
//             // Start transaction
//             await connection.beginTransaction();

//             try {
//                 // Insert data into susar table
//                 const susarId = await insertSusarData(product);

//                 // Insert data into produit table
//                 await insertProductData({ susarId, ...product });

//                 // Insert data into pt table
//                 await insertPtData({ susarId, ...product });

//                 // Commit transaction
//                 await connection.commit();
//             } catch (error) {
//                 // Rollback transaction in case of error
//                 await connection.rollback();
//                 console.error('Transaction rolled back:', error);
//             }
//         }

//         await disconnect();
//     } catch (error) {
//         console.error('Error transferring data:', error);
//     }
// }

// transferData();

