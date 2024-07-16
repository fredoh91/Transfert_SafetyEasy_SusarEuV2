
  import { 
    createPoolSusarEu,
    closePoolSusarEu,
    createPoolSafetyEasy,
    closePoolSafetyEasy
  } from './db/db.js';

  import {
    donne_objIntSubDmm,
    getSusarBNPV_v2,
    donne_lstMasterId,
    getMedicBNPV_v2,
    getEIBNPV_v2,
    getMedHistBNPV_v2,
    getDonneesEtudeBNPV_v2,
    getIndicationBNPV_v2,
    insertDataSUSAR_EU_v2,
  } from './db/susarEuQueries_v2.js'

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

/**
 * 
 * trt_HL_SA : permet d'itérer sur le tableau d'objet a importer  
 * 
 * @param {Connection} connectionSusarEu : connexion vers la BDD SusarEu
 * @param {Connection} connectionSafetyEasy : connexion vers la BDD Safety Easy : BNPV
 * @param {Array <objIntSubDmm>} lstObjIntSubDmm : tableau d'objet avec les HL, LL et substances associées à importer
 * @param {Date} datePivot : date autour de laquelle on va requêter dans la BNPV. C'est paramétrable, notamment pour pouvoir réaliser un reprise des données sur une grande période
 */
const trt_HL_SA = async (connectionSusarEu,connectionSafetyEasy,lstObjIntSubDmm,datePivot = new Date()) => {

  const lstSubHighLevel = lstObjIntSubDmm.map(tab=>tab.active_substance_high_level)
                                          .filter((value, index, array) => array.indexOf(value) === index)

  for (const subHighLevel of lstSubHighLevel) {

    const lstSubLowLevel = lstObjIntSubDmm.filter(HL => HL.active_substance_high_level === subHighLevel)

    await trt_LL_SA(connectionSusarEu,connectionSafetyEasy,lstSubLowLevel,datePivot,lstSubLowLevel[0].association_de_substances)

  }
}

/**
 * 
 * @param {Connection} connectionSusarEu : connexion vers la BDD SusarEu
 * @param {Connection} connectionSafetyEasy : connexion vers la BDD Safety Easy : BNPV
 * @param {Array <objIntSubDmm>} lstObjIntSubDmm : tableau d'objet avec les HL, LL et substances associées à importer
 * @param {Date} datePivot : date autour de laquelle on va requêter dans la BNPV. C'est paramétrable, notamment pour pouvoir réaliser un reprise des données sur une grande période 
 * @param {boolean} assSub : TRUE : assocciation de substance - FALSE : ce n'est pas une association de substance
 */
const trt_LL_SA = async (connectionSusarEu,connectionSafetyEasy,lstObjIntSubDmm,datePivot, assSub) => {
  
  // AWAIT : On recupère les différents master_id pour les différentes LL selon la date pivot envoyée

    const lstSubHighLevel = lstObjIntSubDmm.map(obj => obj.active_substance_high_level)
                                          .filter((value, index, self) => self.indexOf(value) === index)
    const lstSubLowLevel = lstObjIntSubDmm.map(obj => obj.active_substance_low_level)

    const lstSusarBNPV = await getSusarBNPV_v2(connectionSafetyEasy, lstSubLowLevel, datePivot, 3 ,1)
    
    const lstMasterId = await donne_lstMasterId (lstSusarBNPV)
    // console.log (lstMasterId , lstMasterId.length)
    if (lstMasterId.length > 0) {
      logger.debug('Nombre de SUSAR à traiter : ' + 
                    lstSusarBNPV.length + 
                    ', pour le High Level : ' +
                    lstSubHighLevel + 
                    ' (Low Level : ' +
                    lstSubLowLevel +
                    ')');

      // AWAIT : On recupère les differents tableaux des differentes requêtes BNPV
      const MedicBNPV = await getMedicBNPV_v2(connectionSafetyEasy, lstMasterId);
      // console.log(MedicBNPV[0]);
  
      const EIBNPV = await getEIBNPV_v2(connectionSafetyEasy, lstMasterId);
      // console.log(EIBNPV[0]);
  
      const MedHistBNPV = await getMedHistBNPV_v2(connectionSafetyEasy, lstMasterId);
      // console.log(MedHistBNPV[0]);
  
      const DonneesEtudeBNPV = await getDonneesEtudeBNPV_v2(connectionSafetyEasy, lstMasterId);
      // console.log(DonneesEtudeBNPV[0]);
  
      const IndicationBNPV = await getIndicationBNPV_v2(connectionSafetyEasy, lstMasterId);
      // console.log(DonneesEtudeBNPV[0]);
  
      // AWAIT : On envoi tous ces tableaux BNPV a une fonction susar_eu qui va créer les données dans les tables
      await insertDataSUSAR_EU_v2(connectionSusarEu,connectionSafetyEasy,lstObjIntSubDmm,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV,DonneesEtudeBNPV,IndicationBNPV)

    }
}

const main = async () => {

  // permet de capturer les erreurs non gérées et de les rediriger dans le fichier de log
  process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    logger.error(err.stack);
    process.exit(1);
  });

  // permet de capturer les promesses rejetées non gérées et de les rediriger dans le fichier de log
  process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    logger.error(reason.stack);
    process.exit(1);
  });


  // traitement principal
  logger.info('Début import : Safety Easy => SUSAR_EU_v2');

  const poolSusarEu = await createPoolSusarEu();
  const poolSafetyEasy = await createPoolSafetyEasy();

  const typeSourceDonnees = process.env.TYPESOURCEDONNEES

  // Récupération de la liste des low-level substance name dans SUSAR_EU
  const connectionSusarEu = await poolSusarEu.getConnection();
  const connectionSafetyEasy = await poolSafetyEasy.getConnection();

  // Création du tableau d'objet avec les substances a importer
  const lstObjIntSubDmm = await donne_objIntSubDmm(connectionSusarEu);

  await trt_HL_SA(connectionSusarEu,connectionSafetyEasy,lstObjIntSubDmm)

  await closePoolSafetyEasy(poolSafetyEasy)

  await closePoolSusarEu(poolSusarEu)

  logger.info('Fin import : Safety Easy => SUSAR_EU_v2');

}

main()