
import mysql from 'mysql2/promise';

import 'dotenv/config'


// -----------------------------------------------------------------------------
// création d'un pool de connexion pour la base SUSAR_EU
// -----------------------------------------------------------------------------
/**
 * 
 * @returns pool
 */
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


// -----------------------------------------------------------------------------
// création d'un pool de connexion pour la base Safety Easy
// -----------------------------------------------------------------------------
/**
 * 
 * @returns pool
 */
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


// -----------------------------------------------------------------------------
// Ferme le pool SUSAR_EU
// -----------------------------------------------------------------------------
/**
 * 
 * @param {*} pool : pool vers SUSAR_EU qui sera fermé
 */
const closePoolSusarEu = async (pool) => {
  try {
    console.log('Fermeture de la connexion à la BDD susar_eu');
    pool.end();
  } catch (err) {
    console.error('Erreur à la fermeture de la connexion de susar_eu :', err);
    throw err;
  }
};


// -----------------------------------------------------------------------------
// Ferme le pool safety easy
// -----------------------------------------------------------------------------
/**
 * 
 * @param {*} pool : pool vers Safety easy qui sera fermé
 */
const closePoolSafetyEasy = async (pool) => {
  try {
    console.log('Fermeture de la connexion à la BDD susar_eu');
    pool.end();
  } catch (err) {
    console.error('Erreur à la fermeture de la connexion de susar_eu :', err);
    throw err;
  }
};

export {
  createPoolSusarEu,
  closePoolSusarEu,
  createPoolSafetyEasy,
  closePoolSafetyEasy
};

