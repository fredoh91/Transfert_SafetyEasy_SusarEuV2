
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
    RecupDonneesBNPV
  } from './db/safetyEasyQueries.js'
  
  import {
    donne_objSubLowLevel,
    effaceTablesSUSAR_EU,
    isSUSAR_EU_unique,
    insertDataSUSAR_EU,
    donne_lstSubLowLevel
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


const insertSUSAR_EU = async (poolSusarEu,objSubLowLevel,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV,DonneesEtudeBNPV) => {
  const connectionSusarEu = await poolSusarEu.getConnection();
  // await effaceTablesSUSAR_EU (connectionSusarEu)
  await insertDataSUSAR_EU(connectionSusarEu,objSubLowLevel,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV,DonneesEtudeBNPV)
  await connectionSusarEu.release();
}

const main = async () => {

  // traitement principal
  logger.info('Début import : Safety Easy => SUSAR_EU_v2');

/////////////////////////////////////////////////////////////////////////////////////
// Utilisez le logger comme d'habitude
// logger.info('Message de journalisation');
// logger.error('Une erreur est survenue');

// Pour la journalisation des écritures MySQL, vous pouvez utiliser le logger de la même manière
// Par exemple :
// const mysqlLogger = logger.child({ component: 'mysql' });

// // Exemple d'utilisation du logger MySQL
// mysqlLogger.info('Requête MySQL exécutée avec succès');
// mysqlLogger.error('Erreur lors de l\'exécution de la requête MySQL');

// // Vous pouvez également utiliser le logStream si nécessaire
// // Par exemple :
// logStream.write('Un message directement vers le flux de journalisation');

// // Fermez le flux de journalisation lorsque vous avez terminé d'écrire des journaux
// logStream.end();
/////////////////////////////////////////////////////////////////////////////////////


const poolSusarEu = await createPoolSusarEu();
const poolSafetyEasy = await createPoolSafetyEasy();

// const typeSourceDonnees = "Base"
const typeSourceDonnees = "Json"

logger.debug('Type d\'origine des données : ' + typeSourceDonnees);

let objSubLowLevel
let lstSubLowLevel
let lstSusarBNPV
let MedicBNPV
let EIBNPV
let MedHistBNPV
let DonneesEtudeBNPV

if (typeSourceDonnees == "Base") {
  
  // ------------------------------------------------------------------------------------------------------
  // --      début de la requete dans SUSAR_EU pour récupérer la liste des low-level substance name      --
  // ------------------------------------------------------------------------------------------------------
  const connectionSusarEu = await poolSusarEu.getConnection();
  
  // const [objSubLowLevel,lstSubLowLevel] = await donne_lstSubLowLevel(connectionSusarEu)
  [objSubLowLevel,lstSubLowLevel] = await donne_lstSubLowLevel(connectionSusarEu)
  
  connectionSusarEu.release();
  // ---------------------------------------------------------------------------------------------------
  // --      fin des requetes dans SUSAR_EU pour récupérer la liste des low-level substance name      --
  // ---------------------------------------------------------------------------------------------------
  
  
  [lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV,DonneesEtudeBNPV] = await RecupDonneesBNPV(poolSafetyEasy,objSubLowLevel,lstSubLowLevel)


} else if (typeSourceDonnees == "Json") {

  [objSubLowLevel,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV,DonneesEtudeBNPV] = await chargeObjBNPV_fromJSON()

}

  await closePoolSafetyEasy(poolSafetyEasy)

  
  await insertSUSAR_EU(poolSusarEu,objSubLowLevel,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV,DonneesEtudeBNPV);

  // const effTbSUSAR_EU = await effaceTablesSUSAR_EU(connectionSusarEu)
  // const insTbSUSAR_EU = await insertDataSUSAR_EU(connectionSusarEu)

  await closePoolSusarEu(poolSusarEu)

  logger.info('Fin import : Safety Easy => SUSAR_EU_v2');

}

main()