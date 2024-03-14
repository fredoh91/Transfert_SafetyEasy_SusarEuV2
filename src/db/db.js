import mysql from 'mysql2/promise';
import 'dotenv/config'


// -------------------------------------------------------------------------------
// --            Création d'un pool de connexion pour la base SUSAR_EU          --
// -------------------------------------------------------------------------------
/**
 * 
 * @returns pool
 */
async function createPoolSusarEu() {
  try {
    const pool = mysql.createPool({
      host: process.env.SUSAR_EU_V2_HOST,
      user: process.env.SUSAR_EU_V2_USER,
      password: process.env.SUSAR_EU_V2_PASSWORD,
      database: process.env.SUSAR_EU_V2_DATABASE
    });
    console.log('Pool BDD susar_eu ouvert');
    return pool;
  } catch (err) {
    console.error('Erreur à la connexion de susar_eu :', err);
    throw err;
  }
}


// -------------------------------------------------------------------------------
// --          Création d'un pool de connexion pour la base Safety Easy         --
// -------------------------------------------------------------------------------
/**
 * 
 * @returns pool
 */
async function createPoolSafetyEasy() {
  try {
    const pool = mysql.createPool({
      host: process.env.SAFETYEASY_HOST,
      user: process.env.SAFETYEASY_USER,
      password: process.env.SAFETYEASY_PASSWORD,
      database: process.env.SAFETYEASY_DATABASE
    });
    console.log('Pool BDD Safety Easy ouvert');
    return pool;
  } catch (err) {
    console.error('Erreur à la connexion de Safety Easy :', err);
    throw err;
  }
};


// -------------------------------------------------------------------------------
// --                          Ferme le pool SUSAR_EU                           --
// -------------------------------------------------------------------------------
/**
 * 
 * @param {*} pool : pool vers SUSAR_EU qui sera fermé
 */
async function closePoolSusarEu(pool) {
  try {
    console.log('Fermeture du pool vers la BDD susar_eu');
    pool.end();
  } catch (err) {
    console.error('Erreur à la fermeture de la connexion de susar_eu :', err);
    throw err;
  }
};


// -------------------------------------------------------------------------------
// --                        Ferme le pool safety easy                          --
// -------------------------------------------------------------------------------
/**
 * 
 * @param {*} pool : pool vers Safety easy qui sera fermé
 */
async function closePoolSafetyEasy(pool) {
  try {
    console.log('Fermeture du pool vers la BDD safety easy');
    pool.end();
  } catch (err) {
    console.error('Erreur à la fermeture de la connexion de safety easy :', err);
    throw err;
  }
}




export {
  createPoolSusarEu,
  closePoolSusarEu,
  createPoolSafetyEasy,
  closePoolSafetyEasy
};

