
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
  donne_lstSubLowLevel
} from './db/susarEuQueries.js'


import {
  sauvegardeObjet,
  chargementObjet,
  chargeObjBNPV_fromJSON
} from './JSON_Save.js'


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
  // await insertDataSUSAR_EU(connectionSusarEu,objSubLowLevel,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV,DonneesEtudeBNPV,IndicationBNPV)
  await connectionSusarEu.release();
}


  // const poolSusarEu = await createPoolSusarEu();
  // const connectionSusarEu = await poolSusarEu.getConnection();
  // // await effaceTablesSUSAR_EU (connectionSusarEu)
  // let a = await isSUSAR_EU_unique (connectionSusarEu,31719194,'EC2024015186',4)
  // console.log(a)
  // let b = await isSUSAR_EU_unique (connectionSusarEu,31719194,'EC2024015187',4)
  // console.log(b)
  // let c = await isSUSAR_EU_unique (connectionSusarEu,31719194,'EC2024015186',6)
  // console.log(c)
  // let d = await isSUSAR_EU_unique (connectionSusarEu,31719191,'EC2024015186',4)
  // console.log(d)
  // let e = await isSUSAR_EU_unique (connectionSusarEu,31719191,'EC2024015187',4)
  // console.log(e)
  // connectionSusarEu.release();
  // await closePoolSusarEu(poolSusarEu)

// const datePivotStatus = new Date()
// const NbJourAvant = 3
// const NbJourApres = 1

// const jourAvant = new Date(datePivotStatus - NbJourAvant * 24 * 60 * 60 * 1000);
// const jourApres = new Date(datePivotStatus + NbJourApres * 24 * 60 * 60 * 1000);
// const startDate = jourAvant.toISOString().slice(0, 10) + " 00:00:00"
// const endDate = jourApres.toISOString().slice(0, 10) + " 23:59:59"


//   // const today = new Date();
//   // const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
//   // const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
//   // const startDate = threeDaysAgo.toISOString().slice(0, 19).replace('T', ' ');
//   // const endDate = threeDaysFromNow.toISOString().slice(0, 19).replace('T', ' ');
//   // console.log("today",today)
//   // console.log("threeDaysAgo",threeDaysAgo)
//   // console.log("threeDaysFromNow",threeDaysFromNow)
//   console.log("startDate",startDate)
//   console.log("endDate",endDate)

// let dateDebut = new Date('2024-02-01')
// let nbJour = 30
// for (let i = 0; i < nbJour; i++) {

//   console.log(dateDebut.toDateString());
//   // console.log(dateDebut.getDate());


//   let jourDapres = new Date(dateDebut);
//   jourDapres.setDate(dateDebut.getDate() + 1);
  
//   // Utiliser la nouvelle date pour la prochaine itération
//   dateDebut = jourDapres;
// }


// const donne_lstSeriousnessCriteria = async (SeriousnessCriteria_brut) => {

//   const tabSeriousnessCriteria_brut = SeriousnessCriteria_brut.split("~~")
//   if (tabSeriousnessCriteria_brut.length != 0) {
//     return tabSeriousnessCriteria_brut.reduce ((accumulator,Crit_encourt)=>{
//       if (!accumulator .includes(Crit_encourt)) {
//         return accumulator  + Crit_encourt + '<BR>';
//       }
//       return accumulator ; 
//     },'')
//   } else {
//     return ""
//   }
// }


// const valEntree = "Death~~Life Threatening~~Death~~Life Threatening~~Death~~Life Threatening~~Death~~Life Threatening~~Death~~Life Threatening~~Death~~Life Threatening~~Death~~Life Threatening~~Death~~Life Threatening"

// const lstSeriousnessCriteria = await donne_lstSeriousnessCriteria (valEntree)

// console.log (lstSeriousnessCriteria)
const test = async () => {

  // traitement principal
  // logger.info('Début import : Safety Easy => SUSAR_EU_v2');

  const poolSusarEu = await createPoolSusarEu();
  const poolSafetyEasy = await createPoolSafetyEasy();

  // const typeSourceDonnees = "Base"
  // const typeSourceDonnees = "Json"
  const typeSourceDonnees = process.env.TYPESOURCEDONNEES

  // logger.debug('Type d\'origine des données : ' + typeSourceDonnees);

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
    
    console.log("objSubLowLevel : ", objSubLowLevel)

    console.log("lstSubLowLevel : ",lstSubLowLevel)
    process.exit(0)

    // Récupération des données dans Safety Easy
    // [lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV,DonneesEtudeBNPV,IndicationBNPV] = await RecupDonneesBNPV(poolSafetyEasy,objSubLowLevel,lstSubLowLevel)

  } else if (typeSourceDonnees == "Json") {
    
    // Récupération des données d'origine Safety Easy dans des fichiers JSON 
    [objSubLowLevel,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV,DonneesEtudeBNPV,IndicationBNPV] = await chargeObjBNPV_fromJSON()

  }

  await closePoolSafetyEasy(poolSafetyEasy)
  // await insertSUSAR_EU(poolSusarEu,objSubLowLevel,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV,DonneesEtudeBNPV,IndicationBNPV);



  await closePoolSusarEu(poolSusarEu)

  // logger.info('Fin import : Safety Easy => SUSAR_EU_v2');

}


test()
