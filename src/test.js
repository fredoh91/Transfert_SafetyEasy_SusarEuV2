
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
  isPaediatricGeriatric,
  donneGroupeAge,
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


// const trt_HL_SA = async (connectionSusarEu,connectionSafetyEasy,lstObjIntSubDmm,datePivot = new Date()) => {
//   const master_id = '32091853'

//   const lstSubHighLevel = lstObjIntSubDmm.map(tab=>tab.active_substance_high_level)
//                                           .filter((value, index, array) => array.indexOf(value) === index)
//   for (const subHighLevel of lstSubHighLevel) {



//     if(subHighLevel==='PARACETAMOL' || subHighLevel==='THIOCOLCHICOSIDE' || subHighLevel==='TRAMADOL') {
//       // if(subHighLevel==='PARACETAMOL' ) {
      
//       // console.log (subHighLevel)
      
//       // lstSubLowLevel est la liste des objIntSubDmm pour le HL en cours.
//       //    On utilisera :
//       //      - lstSubLowLevel[0].active_substance_high_level     : en tant que nom de high level => dans la variable highLevelSubName
//       //      - lstSubLowLevel[0].id_int_sub     : en tant que id de high level => dans la variable id_int_sub
//     // début de la transaction
//       await connectionSusarEu.beginTransaction();
//       const lstSubLowLevel = lstObjIntSubDmm.filter(HL => HL.active_substance_high_level === subHighLevel)
      
//       const highLevelSubName = lstSubLowLevel[0].active_substance_high_level
//       const id_int_sub = lstSubLowLevel[0].id_int_sub


//       const assSub = lstSubLowLevel[0].association_de_substances

//       // console.log(lstSubLowLevel)

//       const tabObjMed = await donne_medicament_by_master_id (connectionSusarEu,master_id)
      
//       // console.log(tabObjMed)
//       // console.log(tabObjEI)
      
//       let tabObjMed_HL= ""
//       if (lstSubLowLevel[0].association_de_substances) {
//         // association de substance
//         // a faire, c'est compliqué
//         // tabObjMed_HL = tabObjMed.filter(obj =>
//           //   lstSubLowLevel.some(sub => sub.ass_tab_LL === obj.substancename)
//         // );
//       } else {
//         // pas d'association de substance
//         tabObjMed_HL = tabObjMed.filter(obj =>
//           lstSubLowLevel.some(sub => sub.active_substance_low_level === obj.substancename)
//         );
//       }
//       // tabObjMed_HL est la liste des médicaments dans SUSAR_EU 
      
//       // console.log(tabObjMed_HL)
//       for (const ObjMed_HL of tabObjMed_HL) {
//         // console.log (ObjMed_HL)
//         // console.log ("medicaments.id : ",ObjMed_HL.id)
//         // il faut faire une fonction pour mettre a jour la table medicament pour tous les objets tabObjMed_HL, en utilisant tabObjMed_HL.id
//         // const MAJ_medicament = await MAJ_medicament_by_master_id (connectionSusarEu,ObjMed_HL.id,highLevelSubName,id_int_sub,assSub)
//         const idSUSAR_EU = ObjMed_HL.susar_id;
//         const SQL_medicament = `UPDATE medicaments
//         SET medicaments.active_substance_high_level = ?,
//         medicaments.intervenant_substance_dmm_id = ?,
//             medicaments.association_de_substances = ?,
//             medicaments.updated_at = CURRENT_TIMESTAMP
//             WHERE medicaments.id = ${ObjMed_HL.id};`

//             const res_upt_medicament = await connectionSusarEu.query(SQL_medicament, [highLevelSubName,id_int_sub,assSub])

//             if(res_upt_medicament[0].affectedRows > 0) {
              
//               if (id_int_sub !== null) {
                
//                 const isUniqueIntSubDmmSusar = await isUnique_intervenant_substance_dmm_susar_eu(connectionSusarEu,idSUSAR_EU,id_int_sub)
//                 if (isUniqueIntSubDmmSusar) {
//                   // INSERT dans la table de liaison susar_eu/intervenant_substance_dmm des ID des deux tables comme clefs étrangères
//                   const SQL_insert_intervenant_substance_dmm_susar_eu = "INSERT INTO intervenant_substance_dmm_susar_eu ( " +
//                   "susar_eu_id," +
//                   "intervenant_substance_dmm_id" +
//                   ") VALUES (" +
//                   "? ," +
//                   "? " +
//                   ");"
                  
//                   const res2_2 = await connectionSusarEu.query(SQL_insert_intervenant_substance_dmm_susar_eu, [
//                     idSUSAR_EU,
//                     id_int_sub
//                   ])
//             }
//           }
          
//           // la MAJ a fonctionné => Il faut regarder que pour chaque objet de tabObjEI, on a bien un couple medicament/substance dans la table substance_pt :
//           // sinon on crée la ligne dans cette table "substance_pt" et on ajoute une entrée dans la table de liaison substance_pt_susar_eu
//           const tabMeddraPt = await donne_effets_indesirables_by_master_id (connectionSusarEu,master_id)
          
//           // on boucle sur les EI_PT - tabMeddraPt (codereactionmeddrapt,reactionmeddrapt)
//           for (const MeddraPt of tabMeddraPt) {

//             // requete dans la table substance_pt pour voir si le couple substance/CodePT n'existe pas déja 
//             const id_substance_pt_2 = await isAlreadyExist_substance_pt(connectionSusarEu,highLevelSubName,MeddraPt.codereactionmeddrapt)
//             let id_substance_pt = null
//             if (id_substance_pt_2 != null) {
//               id_substance_pt = id_substance_pt_2
//               //      - si OUI : - on récupère substance_pt.id
//               //                 - creation d'une ligne dans la table substance_pt_susar_eu avec :
//               //                    - susar_eu_id = idSUSAR_EU
//               //                    - substance_pt_id = substance_pt.id
//             } else {
//               //      - si NON : - on crée une ligne dans substance_pt.id
//               //                 - on récupère substance_pt.id ainsi crée
//               //                 - creation d'une ligne dans la table substance_pt_susar_eu avec :
//               //                    - susar_eu_id = idSUSAR_EU
//               //                    - substance_pt_id = substance_pt.id
//               const SQL_insert_substance_pt = "INSERT INTO substance_pt ( " + 
//                         "active_substance_high_level," +
//                         "codereactionmeddrapt," +
//                         "reactionmeddrapt," +
//                         "created_at," +
//                         "updated_at " +
//                         ") VALUES (" +
//                         "? ," +
//                         "? ," +
//                         "? ," +
//                         "CURRENT_TIMESTAMP, " +
//                         "CURRENT_TIMESTAMP " +
//                         ");"
//               const res_insert_substance_pt = await connectionSusarEu.query(SQL_insert_substance_pt, [
//                 highLevelSubName,
//                 MeddraPt.codereactionmeddrapt, 
//                 MeddraPt.reactionmeddrapt
//               ]);
//               id_substance_pt = res_insert_substance_pt[0].insertId;
//             }

//             const Exist_substance_pt_susar_eu = await isAlreadyExist_substance_pt_susar_eu (connectionSusarEu,id_substance_pt,idSUSAR_EU)
//             // console.log (Exist_substance_pt_susar_eu)

//             if (Exist_substance_pt_susar_eu === null ) {
//               const SQL_insert_substance_pt_susar_eu = "INSERT INTO substance_pt_susar_eu ( " + 
//                         "substance_pt_id," +
//                         "susar_eu_id" +
//                         ") VALUES (" +
//                         "? ," +
//                         "? " +
//                         ");"
//               const res_insert_substance_pt_susar_eu = await connectionSusarEu.query(SQL_insert_substance_pt_susar_eu, [
//                 id_substance_pt,
//                 idSUSAR_EU
//               ]);
//             }
//           }



//         }
//         // console.log (MAJ_medicament)
//       }

//       await connectionSusarEu.commit();

//     }

//   }
// }

/**
 * 
 * @param {Connection} connectionSusarEu : connexion vers la BDD SusarEu
 * @param {Connection} connectionSafetyEasy : connexion vers la BDD Safety Easy : BNPV
 * @param {Array <objIntSubDmm>} lstObjIntSubDmm : tableau d'objet avec les HL, LL et substances associées à importer
 * @param {Date} datePivot : date autour de laquelle on va requêter dans la BNPV. C'est paramétrable, notamment pour pouvoir réaliser un reprise des données sur une grande période 
 * @param {boolean} assSub : TRUE : assocciation de substance - FALSE : ce n'est pas une association de substance
 */
const trt_LL_SA = async (connectionSusarEu,connectionSafetyEasy,lstObjIntSubDmm,datePivot = new Date(), assSub = false) => {
  
  // AWAIT : On recupère les différents master_id pour les différentes LL selon la date pivot envoyée

    const lstSubHighLevel = lstObjIntSubDmm.map(obj => obj.active_substance_high_level)
                                          .filter((value, index, self) => self.indexOf(value) === index)
    const lstSubLowLevel = lstObjIntSubDmm.map(obj => obj.active_substance_low_level)

    const lstSusarBNPV = await getSusarBNPV_v2(connectionSafetyEasy, lstSubLowLevel, datePivot, 3 ,1)
    
    const lstMasterId = await donne_lstMasterId (lstSusarBNPV)
    // console.log (lstMasterId , lstMasterId.length)
    if (lstMasterId.length > 0) {
      console.log('Nombre de SUSAR à traiter : ' + 
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
  

      await sauvegardeObjet(lstSusarBNPV,"lstSusarBNPV")
      await sauvegardeObjet(MedicBNPV,"MedicBNPV")
      await sauvegardeObjet(EIBNPV,"EIBNPV")
      await sauvegardeObjet(MedHistBNPV,"MedHistBNPV")
      await sauvegardeObjet(DonneesEtudeBNPV,"DonneesEtudeBNPV")
      await sauvegardeObjet(IndicationBNPV,"IndicationBNPV")
      // AWAIT : On envoi tous ces tableaux BNPV a une fonction susar_eu qui va créer les données dans les tables
      // await insertDataSUSAR_EU_v2(connectionSusarEu,lstObjIntSubDmm,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV,DonneesEtudeBNPV,IndicationBNPV)

    }
}


const test = async () => {

  const poolSusarEu = await createPoolSusarEu();
  const poolSafetyEasy = await createPoolSafetyEasy();


  const typeSourceDonnees = process.env.TYPESOURCEDONNEES

  const connectionSusarEu = await poolSusarEu.getConnection();
  const connectionSafetyEasy = await poolSafetyEasy.getConnection();

  // await sauvegardeObjet(lstSusarBNPV,"lstSusarBNPV")
  // await sauvegardeObjet(MedicBNPV,"MedicBNPV")
  // await sauvegardeObjet(EIBNPV,"EIBNPV")
  // await sauvegardeObjet(MedHistBNPV,"MedHistBNPV")
  // await sauvegardeObjet(DonneesEtudeBNPV,"DonneesEtudeBNPV")
  // await sauvegardeObjet(IndicationBNPV,"IndicationBNPV")

  const lstSusarBNPV = await chargementObjet("lstSusarBNPV_test")
  const MedicBNPV = await chargementObjet("MedicBNPV_test")
  const EIBNPV = await chargementObjet("EIBNPV_test")
  const MedHistBNPV = await chargementObjet("MedHistBNPV_test")
  const DonneesEtudeBNPV = await chargementObjet("DonneesEtudeBNPV_test")
  const IndicationBNPV = await chargementObjet("IndicationBNPV_test")


// console.log (lstSusarBNPV)

  let iTousSUSAR = 0
      
  for (const susar of lstSusarBNPV) {
    iTousSUSAR++

    // console.log(susar)

    const NivPrio = await donneNiveauPriorisation (connectionSusarEu,connectionSafetyEasy,susar,EIBNPV)
    console.log(susar['master_id']," : ",NivPrio)


    // const resDonneGroupeAge = await donneGroupeAge (susar['patientagegroup'],susar['patientonsetage'],susar['patientonsetageunitlabel'])
    // const resIsPaediatricGeriatric = await isPaediatricGeriatric (susar['patientagegroup'],susar['patientonsetage'],susar['patientonsetageunitlabel'])
    // console.log(susar['master_id']," : ",resDonneGroupeAge," , isPediaGeria : ",resIsPaediatricGeriatric)
    
  }

  console.log("Nombre de SUSAR à traiter : ",iTousSUSAR)

  await closePoolSafetyEasy(poolSafetyEasy)


  await closePoolSusarEu(poolSusarEu)

}


test()
