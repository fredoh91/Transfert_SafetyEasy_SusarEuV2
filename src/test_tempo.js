
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
  isDeathLifethreatening,
  isCasEurope,
  isDME,
  isIME,
  isPositiveRechallenge,
  isParentChild,
  donneNiveauPriorisation,
  donneLst_SQL_IN,
} from './priorisation.js'



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
  // pour ces tests, a supprimer ensuite
  donneObjMed_HL_AssSub_pour_MAJ,
  donne_medicament_by_master_id,
  donne_effets_indesirables_by_master_id,
  isUnique_intervenant_substance_dmm_susar_eu,
  isAlreadyExist_substance_pt,
  isAlreadyExist_substance_pt_susar_eu,
} from './db/susarEuQueries_v2.js'

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




const test = async () => {

  // const originalArray = [
  //   "Varices de l'oesophage",
  //   "Lésions de l’estomac",
  //   "Douleur à l’épaule"
  // ];
  
  // // Ajouter des guillemets simples autour de chaque élément du tableau et échapper les guillemets simples existants
  // const formattedArray = originalArray.map(element => `'${element.replace("'", "\\'")}'`);
  
  // // Concaténer les éléments du tableau en une chaîne de caractères séparée par des virgules
  // const formattedString = `(${formattedArray.join(',')})`;
  
  // console.log(formattedString);



  // const originalArray = [
  //   "Varices de l'oesophage",
  //   "Lésions de l'estomac",
  //   "Douleur à l'épaule"
  // ];
  
  // // Ajouter des guillemets simples autour de chaque élément du tableau et échapper tous les guillemets simples
  // const formattedArray = originalArray.map(element => `'${element.replace(/'/g, "\\'")}'`);
  
  // // Concaténer les éléments du tableau en une chaîne de caractères séparée par des virgules
  // const formattedString = `(${formattedArray.join(',')})`;
  
  // console.log(formattedString);
  
  
  const EIBNPV = await chargementObjet("EIBNPV_test")
  
  const lstLibLLT = await donneLst_SQL_IN(EIBNPV)

  const SQL = `SELECT COUNT(*) AS NbLignes FROM ime WHERE ime.inactif = FALSE AND ime.llt_name_fr IN ${lstLibLLT}`;
  console.log(SQL);

  // console.log(lstLibLLT);
  
  
  

}


test()
