
  import { 
    createPoolSusarEu,
    closePoolSusarEu,
    createPoolSafetyEasy,
    closePoolSafetyEasy
  } from './db/db.js';
  
  import {
    getSusarBNPV,
    getMedicBNPV,
    getEIBNPV,
    getMedHistBNPV,
    getDonneesEtudeBNPV,
    getIndicationBNPV,
    RecupDonneesBNPV
  } from './db/safetyEasyQueries.js'
  
  import {
    donne_objSubLowLevel,
    effaceTablesSUSAR_EU,
    insertDataSUSAR_EU,
    donne_lstSubLowLevel,
    // donne_objSubHighLowLevelAss
  } from './db/susarEuQueries.js'


  import {
    sauvegardeObjet,
    chargementObjet,
    chargeObjBNPV_fromJSON
  } from './JSON_Save.js'

import {
  logStream , 
  logger
} from './logs_config.js'

import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';

const currentUrl = import.meta.url;
const currentDir = path.dirname(fileURLToPath(currentUrl));
const envPath = path.resolve(currentDir, '.', '.env');
dotenv.config({ path: envPath });

const insertSUSAR_EU = async (poolSusarEu,objSubLowLevel,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV,DonneesEtudeBNPV,IndicationBNPV) => {
  const connectionSusarEu = await poolSusarEu.getConnection();
  // await effaceTablesSUSAR_EU (connectionSusarEu)
  await insertDataSUSAR_EU(connectionSusarEu,objSubLowLevel,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV,DonneesEtudeBNPV,IndicationBNPV)
  await connectionSusarEu.release();
}

const main = async () => {

  // traitement principal
  logger.info('Début import : Safety Easy => SUSAR_EU_v2');

  const poolSusarEu = await createPoolSusarEu();
  const poolSafetyEasy = await createPoolSafetyEasy();

  const typeSourceDonnees = process.env.TYPESOURCEDONNEES

  logger.debug('Type d\'origine des données : ' + typeSourceDonnees);

  let objSubLowLevel
  let lstSubLowLevel
  let lstSusarBNPV
  let MedicBNPV
  let EIBNPV
  let MedHistBNPV
  let DonneesEtudeBNPV
  let IndicationBNPV

  if (typeSourceDonnees == "Base") {

    // Récupération de la liste des low-level substance name dans SUSAR_EU
    const connectionSusarEu = await poolSusarEu.getConnection();
    [objSubLowLevel,lstSubLowLevel] = await donne_lstSubLowLevel(connectionSusarEu)
    connectionSusarEu.release();

    // Récupération des données dans Safety Easy
    [lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV,DonneesEtudeBNPV,IndicationBNPV] = await RecupDonneesBNPV(poolSafetyEasy,objSubLowLevel,lstSubLowLevel)

  } else if (typeSourceDonnees == "Json") {
    
    // Récupération des données d'origine Safety Easy dans des fichiers JSON 
    [objSubLowLevel,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV,DonneesEtudeBNPV,IndicationBNPV] = await chargeObjBNPV_fromJSON()

  }

  await closePoolSafetyEasy(poolSafetyEasy)
  await insertSUSAR_EU(poolSusarEu,objSubLowLevel,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV,DonneesEtudeBNPV,IndicationBNPV);

  await closePoolSusarEu(poolSusarEu)

  logger.info('Fin import : Safety Easy => SUSAR_EU_v2');

}

main()