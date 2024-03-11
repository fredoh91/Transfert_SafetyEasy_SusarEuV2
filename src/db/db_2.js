
// const mysql = require('mysql2/promise');
import mysql from 'mysql2/promise';

// const dotenv = require('dotenv');
// import * as dotenv from 'dotenv';
import 'dotenv/config'

// Charge les variables d'environnement à partir du fichier .env dans le répertoire /config
// dotenv.config({ path: '.env' });

// console.log(process.env);
// require('dotenv').config();
// console.log(process.env)
// stop()
let susarEuConnection = null;
// let safetyEasyConnection = null;


const createConnectionSusarEu = async () => {
  try {
    // console.log("1");
    susarEuConnection = await mysql.createConnection({
      host: process.env.SUSAR_EU_V2_HOST,
      user: process.env.SUSAR_EU_V2_USER,
      password: process.env.SUSAR_EU_V2_PASSWORD,
      database: process.env.SUSAR_EU_V2_DATABASE
    });
    // console.log("2");
    console.log('BDD susar_eu connectée');
    return susarEuConnection;
  } catch (err) {
    console.error('Erreur à la connexion de susar_eu :', err);
    throw err;
  }
};

const createPoolSusarEu = async () => {
  try {
    const pool = mysql.createPool({
      host: process.env.SUSAR_EU_V2_HOST,
      user: process.env.SUSAR_EU_V2_USER,
      password: process.env.SUSAR_EU_V2_PASSWORD,
      database: process.env.SUSAR_EU_V2_DATABASE
    });
    console.log('BDD susar_eu connectée');
    return pool;
  } catch (err) {
    console.error('Erreur à la connexion de susar_eu :', err);
    throw err;
  }
};

const createPoolSafetyEasy = async () => {
  try {
    const pool = mysql.createPool({
      host: process.env.SAFETYEASY_HOST,
      user: process.env.SAFETYEASY_USER,
      password: process.env.SAFETYEASY_PASSWORD,
      database: process.env.SAFETYEASY_DATABASE
    });
    console.log('BDD Safety Easy connectée');
    return pool;
  } catch (err) {
    console.error('Erreur à la connexion de Safety Easy :', err);
    throw err;
  }
};

const closePoolSusarEu = async (pool) => {
  try {
    console.log('Fermeture de la connexion à la BDD susar_eu');
    pool.end();
  } catch (err) {
    console.error('Erreur à la fermeture de la connexion de susar_eu :', err);
    throw err;
  }
};

const closePoolSafetyEasy = async (pool) => {
  try {
    console.log('Fermeture de la connexion à la BDD susar_eu');
    pool.end();
  } catch (err) {
    console.error('Erreur à la fermeture de la connexion de susar_eu :', err);
    throw err;
  }
};

// const createPoolConnectionSusarEu = async () => {
//   try {
//     // console.log("1");
//     susarEuConnection = await mysql.createConnection({
//       host: process.env.SUSAR_EU_V2_HOST,
//       user: process.env.SUSAR_EU_V2_USER,
//       password: process.env.SUSAR_EU_V2_PASSWORD,
//       database: process.env.SUSAR_EU_V2_DATABASE
//     });
//     // console.log("2");
//     console.log('BDD susar_eu connectée');
//     return susarEuConnection;
//   } catch (err) {
//     console.error('Erreur à la connexion de susar_eu :', err);
//     throw err;
//   }
// };

// const poolSusarEu = mysql.createPool({
//   host: process.env.SUSAR_EU_V2_HOST,
//   user: process.env.SUSAR_EU_V2_USER,
//   password: process.env.SUSAR_EU_V2_PASSWORD,
//   database: process.env.SUSAR_EU_V2_DATABASE,
//   waitForConnections: true,
//   connectionLimit: 10,
//   maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
//   idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
//   queueLimit: 0,
//   enableKeepAlive: true,
//   keepAliveInitialDelay: 0,
// });


const closeConnectionSusarEu = async (connection) => {
  try {
    if (connection) {
      await connection.end();
      console.log('Disconnected from susar_eu database');
    } else {
      console.log('No active connection to susar_eu database');
    }
  } catch (err) {
    console.error('Error disconnecting from susar_eu database:', err);
    throw err;
  }
};

// const closePoolConnectionSusarEu = async (connection) => {
//   try {
//     if (connection) {
//       await connection.release();
//       console.log('Disconnected from susar_eu database');
//     } else {
//       console.log('No active connection to susar_eu database');
//     }
//   } catch (err) {
//     console.error('Error disconnecting from susar_eu database:', err);
//     throw err;
//   }
// };


// const closeConnectionSusarEu = async (connection) => {
//   try {
//     await connection.end();
//     console.log('Disconnected from susar_eu database');
//     connection = null;
//   } catch (err) {
//     console.error('Error disconnecting from susar_eu database:', err);
//     throw err;
//   }
// };

// // Connexion à la base de données safetyeasy
// const createConnectionSafetyEasy = async () => {
//   safetyEasyConnection = mysql.createConnection({
//     host: process.env.SAFETYEASY_HOST,
//     user: process.env.SAFETYEASY_USER,
//     password: process.env.SAFETYEASY_PASSWORD,
//     database: process.env.SAFETYEASY_DATABASE
//   });

//   try {
//     await new Promise((resolve, reject) => {
//       safetyEasyConnection.connect((err) => {
//         if (err) {
//           reject(err);
//         } else {
//           console.log('Connected to safetyeasy database');
//           resolve();
//         }
//       });
//     });
//     return safetyEasyConnection;
//   } catch (err) {
//     console.error('Error connecting to safetyeasy database:', err);
//     throw err;
//   }
// };

// const closeConnectionSafetyEasy = async () => {
//   try {
//     await safetyEasyConnection.end();
//     console.log('Disconnected from safetyeasy database');
//     safetyEasyConnection = null;
//   } catch (err) {
//     console.error('Error disconnecting from safetyeasy database:', err);
//     throw err;
//   }
// };

// module.exports = {
//   createConnectionSusarEu,
//   closeConnectionSusarEu,
//   createConnectionSafetyEasy,
//   closeConnectionSafetyEasy,
//   getConnectionSusarEu: () => susarEuConnection,
//   getConnectionSafetyEasy: () => safetyEasyConnection
// };

export {
  createConnectionSusarEu,
  closeConnectionSusarEu,
  susarEuConnection,
  createPoolSusarEu,
  closePoolSusarEu,
  createPoolSafetyEasy,
  closePoolSafetyEasy
};
// module.exports = {
//   createConnectionSusarEu,
//   closeConnectionSusarEu,
//   getConnectionSusarEu: () => susarEuConnection
// };
