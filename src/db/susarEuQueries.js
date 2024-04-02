
import {
  logStream , 
  logger
} from '../logs_config.js'



/**
 * @typedef {import('../types').active_substance_grouping} active_substance_grouping
 * @typedef {import('../types').susar_eu} susar_eu
 * @typedef {import('../types').medicaments} medicaments
 * @typedef {import('../types').effets_indesirables} effets_indesirables
 * @typedef {import('../types').medical_history} medical_history
 * @typedef {import('../types').donnees_etude} donnees_etude
 * @typedef {import('../types').intervenant_substance_dmm} intervenant_substance_dmm
 * 
 */

/**
 * 
 * @param {Connection} connectionSusarEu 
 * @param {string} actSub_hl : substance active (high level)
 * @param {number} codePt : code Meddra PT
 * @returns {Promise<null|number>} : si le couple substance/code PT n'existe pas : retourne null
 *                            si le couple substance/code PT existe : retourne l'id de ce couple dans la table substance_pt
 */
async function isAlreadyExist_substance_pt (connectionSusarEu,actSub_hl,codePt) {
    const SQL_isAlreadyExist = "SELECT sp.id, " +
                                      "sp.active_substance_high_level, " +
                                      "sp.codereactionmeddrapt " +
                                "FROM substance_pt sp " + 
                                "WHERE sp.active_substance_high_level = ? " +
                                  "AND sp.codereactionmeddrapt = ? ;"
    const results = await connectionSusarEu.query(SQL_isAlreadyExist, [
                                                    actSub_hl,
                                                    codePt
                                                  ] 
    );

    if (results[0].length > 0) {
      // on a déja ce couple dans la table substance_pt
      return results[0][0].id
    } else {
      // on n'a pas encore ce couple dans la table substance_pt
      return null
    }
  }

/**
 * donne_objSubLowLevel : récupération de la table de correspondance high level / low level
 * 
 * @param {Connection} connectionSusarEu 
 * @returns {Promise<Array<[active_substance_grouping[]]>>} retourne une promesse de tableau d'objet active_substance_grouping :
 *            - contenu du résultat de la requête vers la table high-level/low-level substance name
 */
async function  donne_objSubLowLevel (connectionSusarEu) {
    const results = await connectionSusarEu.query(
      "SELECT * FROM active_substance_grouping WHERE active_substance_grouping.inactif = 0 ;"
    );
    // console.log(results[0][0])
    // console.log(results[0])
    // const lstSubLowLevel = results[0].map(obj => obj.active_substance_high_le_low_level);

    return results[0];
    // return Promise.resolve(results[0]);
  }


/**
 * Permet de retourner le contenu de la table intervenant_substance_dmm pour pouvoir attribuer une DMM, pôle, évaluateur a un susar
 * 
 * @param {Connection} connectionSusarEu : connection MySQL2
 * @returns {Promise<Array<intervenant_substance_dmm>>} : retourne une promesse de tableau d'objet intervenant_substance_dmm
 */
  async function donne_objIntSubDmm (connectionSusarEu) {
    const results = await connectionSusarEu.query(
      "SELECT isd.id, isd.dmm, isd.pole_long, isd.pole_court, isd.evaluateur, isd.active_substance_high_level, isd.type_sa_ms_mono, association_de_substances " + 
      "FROM intervenant_substance_dmm isd " +
      "WHERE inactif = 0 "
    );

    return results[0];
  }


/**
 * effaceTablesSUSAR_EU : Efface les tables SUSAR_EU avant import pour DEV
 * 
 * @param {Connection} connectionSusarEu 
 */
  async function effaceTablesSUSAR_EU (connectionSusarEu) {
    const resu_1 = await connectionSusarEu.query('SET FOREIGN_KEY_CHECKS = 0;');
    try {
      const res_2 = connectionSusarEu.query('TRUNCATE susar_eu;');
      const res_3 = connectionSusarEu.query('TRUNCATE medicaments;');
      const res_4 = connectionSusarEu.query('TRUNCATE effets_indesirables;');
      const res_5 = connectionSusarEu.query('TRUNCATE indications;');
      const res_6 = connectionSusarEu.query('TRUNCATE medical_history;');
      const res_7 = connectionSusarEu.query('TRUNCATE intervenant_substance_dmm_susar_eu;');
      const res_8 = connectionSusarEu.query('TRUNCATE substance_pt;');
      const res_9 = connectionSusarEu.query('TRUNCATE substance_pt_susar_eu;');
      const [
          resu_2, 
          resu_3, 
          resu_4, 
          resu_5, 
          resu_6
            ] = await Promise.all([
                                res_2, 
                                res_3, 
                                res_4, 
                                res_5, 
                                res_6, 
                                res_7, 
                                res_8,
                                res_9]);
      await connectionSusarEu.query('SET FOREIGN_KEY_CHECKS = 1;');
      // const resu_fin = await connectionSusarEu.query('SET FOREIGN_KEY_CHECKS = 1;');
    } catch (err) {
      console.error(erreur);
    } finally {
      // await closePoolSusarEu(poolSusarEu)
    }
  }
  


/**
 * isUnique_SUSAR_EU : Avant insertion d'une ligne dans la table susar_eu,
 *        cette fonction vérifie que la ligne n'exite pas déjà
 * 
 * @param {Connection} connectionSusarEu 
 * @param {number} master_id 
 * @param {string} specificcaseid 
 * @param {number} DLPVersion 
 * @returns {Promise<boolean>} : retourne une promesse contenant un booléen, si TRUE le susar n'existe pas, on pourra le créer 
 *                                 si FALSE le susar existe, il ne faudra pas le créer
 */
async function isUnique_SUSAR_EU (connectionSusarEu,master_id,specificcaseid,DLPVersion) {
  const SQL_master_id_unique = `SELECT 
                                  COUNT(susar_eu.id) AS nb
                                FROM
                                  susar_eu
                                WHERE
                                  susar_eu.master_id = ${master_id};`
  const SQL_specificcaseid_DLPVersion_unique = `SELECT
                                                  COUNT(susar_eu.id) AS nb
                                                FROM
                                                  susar_eu
                                                WHERE
                                                  susar_eu.specificcaseid = '${specificcaseid}'
                                                  AND susar_eu.dlpversion = 	${DLPVersion}
                                                  ;`
  try {
    const res_1 = connectionSusarEu.query(SQL_master_id_unique);
    const res_2 = connectionSusarEu.query(SQL_specificcaseid_DLPVersion_unique);
    const [resu_1, resu_2] = await Promise.all([res_1, res_2]);

    if(resu_1[0][0]['nb'] === 0 && resu_2[0][0]['nb'] === 0 ) { 
      return true
    } else {
      return false
    }
  } catch (err) {
    console.error(erreur);
  } finally {
    // await closePoolSusarEu(poolSusarEu)
  }
}

/**
 * 
 * @param {Connection} connectionSusarEu 
 * @param {number} susar_eu_id 
 * @param {number} intervenant_substance_dmm_id 
 * @returns {Promise<boolean>} : retourne une promesse contenant un booléen, si TRUE le couple susar_eu/intervenant_substance_dmm n'existe pas, on pourra le créer dans la table intervenant_substance_dmm_susar_eu
 *                                 si FALSE il existe, il ne faudra pas le créer dans la table intervenant_substance_dmm_susar_eu
 */
async function isUnique_intervenant_substance_dmm_susar_eu (connectionSusarEu,susar_eu_id,intervenant_substance_dmm_id) {

  const SQL_intervenant_substance_dmm_susar_eu_unique = `SELECT
                                                          COUNT(isds.susar_eu_id) AS nb
                                                        FROM
                                                          intervenant_substance_dmm_susar_eu isds
                                                        WHERE
                                                          isds.susar_eu_id = ${susar_eu_id}
                                                          AND isds.intervenant_substance_dmm_id = ${intervenant_substance_dmm_id}
                                                          ;`
  try {
    const res = await connectionSusarEu.query(SQL_intervenant_substance_dmm_susar_eu_unique)
    if(res[0][0]['nb'] === 0 ) { 
      return true
    } else {
      return false
    }
  } catch (err) {
    console.error(erreur);
  } finally {}
}


/**
 * 
 *  INSERTs dans la base SUSAR_EU des différentes données correspondants aux SUSARs :
 *                - SUSAR
 *                - Medicaments
 *                - Effets indésirables
 *                - Medical history
 * 
 * @param {Connection} connectionSusarEu 
 * @param {active_substance_grouping[]} objSubLowLevel 
 * @param {susar_eu[]} lstSusarBNPV 
 * @param {medicaments[]} MedicBNPV 
 * @param {effets_indesirables[]} EIBNPV 
 * @param {medical_history[]} MedHistBNPV 
 * @param {donnees_etude[]} DonneesEtudeBNPV 
*/
async function insertDataSUSAR_EU(connectionSusarEu,objSubLowLevel,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV,DonneesEtudeBNPV) {
  try {

    // récupération de la liste des intervenant_substance_dmm
    const objIntSubDmm = await donne_objIntSubDmm (connectionSusarEu) 

    // début de la transaction
    await connectionSusarEu.beginTransaction();
    
    /*************************************************************************************** */        

    // boucle pour les INSERT dans les différentes tables 
    let iTousSUSAR = 0
    let iSUSAR_importes = 0
    
    for (const susar of lstSusarBNPV) {
      iTousSUSAR++
      
      // // pour tester, sort après xx susars
      // if (iTousSUSAR > 5) {
      //   break
      // }
      console.log(iTousSUSAR,":",susar['master_id'])
      logger.info("Import du SUSAR (master_id) : " + susar['master_id'])
      // vérification avec les INSERT d'un SUSAR et des ses enregistrements liés :
      //      - On regarde que "susar['master_id']" n'existe pas déjà dans la table "susar_eu"
      //      - On regarde que "susar['specificcaseid'] AND susar['DLPVersion']" n'existe pas déjà dans la table "susar_eu"
      const isUnique = await isUnique_SUSAR_EU (connectionSusarEu,susar['master_id'],susar['specificcaseid'],susar['DLPVersion'])

      if (isUnique) {

        iSUSAR_importes++


        // gestion des critères de gravité
        const lstSeriousnessCriteria = await donne_lstSeriousnessCriteria (susar['seriousnesscriteria'])


        // console.log ("DonneesEtudeBNPV : ",DonneesEtudeBNPV)
        // On récupère les données de l'étude
        const DonneesEtudeFiltre = DonneesEtudeBNPV.filter(DonneesEtude => DonneesEtude.master_id === susar['master_id']);
        
        let studytitle = ""
        let sponsorstudynumb = ""
        let num_eudract = ""
        let pays_etude = ""
        for (const DonneesEtude of DonneesEtudeFiltre) {
          // pour charger le high level substance name


          if (studytitle.length == 0) {
            studytitle = DonneesEtude['studytitle']
          } else {
            studytitle += "/" + DonneesEtude['studytitle']
          }

          if (sponsorstudynumb.length == 0) {
            sponsorstudynumb = DonneesEtude['sponsorstudynumb']
          } else {
            sponsorstudynumb += "/" + DonneesEtude['sponsorstudynumb']
          }

          if (num_eudract.length == 0) {
            num_eudract = DonneesEtude['num_eudract']
          } else {
            num_eudract += "/" + DonneesEtude['num_eudract']
          }

          if (pays_etude.length == 0) {
            pays_etude = DonneesEtude['pays_etude']
          } else {
            pays_etude += "/" + DonneesEtude['pays_etude']
          }

        }
        // INSERT dans la table susar_eu
        
        // const SQL_insert_susar_eu = "INSERT INTO susar_eu (studytitle,sponsorstudynumb,created_at,updated_at) VALUES (?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);"
        const SQL_insert_susar_eu = "INSERT INTO susar_eu ( " +
                                                  "master_id," +
                                                  "caseid," +
                                                  "specificcaseid," +
                                                  "dlpversion," +
                                                  "creationdate," +
                                                  "statusdate," +
                                                  "world_wide_id," +
                                                  "is_case_serious," +
                                                  "seriousness_criteria_brut," +
                                                  "seriousness_criteria," +
                                                  "patient_sex," +
                                                  "patient_age," +
                                                  "patient_age_unit_label," +
                                                  "patient_age_group," +
                                                  "pays_survenue," +
                                                  "narratif, " +
                                                  "studytitle, " +
                                                  "sponsorstudynumb, " +
                                                  "num_eudract, " +
                                                  "pays_etude, " +
                                                  "created_at," +
                                                  "updated_at " +
                                        ") VALUES (" +
                                                  "? ," +
                                                  "? ," +
                                                  "? ," +
                                                  "? ," +
                                                  "? ," +
                                                  "? ," +
                                                  "? ," +
                                                  "? ," +
                                                  "? ," +
                                                  "? ," +
                                                  "? ," +
                                                  "? ," +
                                                  "? ," +
                                                  "? ," +
                                                  "? ," +
                                                  "? ," +
                                                  "? ," +
                                                  "? ," +
                                                  "? ," +
                                                  "? ," +
                                                  "CURRENT_TIMESTAMP, " +
                                                  "CURRENT_TIMESTAMP " +
                                          ");" 

        const res1 = await connectionSusarEu.query(SQL_insert_susar_eu, [
          susar['master_id'], 
          susar['caseid'], 
          susar['specificcaseid'], 
          susar['DLPVersion'], 
          susar['creationdate'], 
          susar['statusdate'], 
          susar['worldwideuniquecaseidentificationnumber'], 
          susar['iscaseserious'], 
          susar['seriousnesscriteria'],
          lstSeriousnessCriteria,
          susar['patientsex'], 
          susar['patientonsetage'], 
          susar['patientonsetageunitlabel'], 
          susar['patientagegroup'], 
          susar['pays_survenue'], 
          susar['narrativeincludeclinical'],
          studytitle,
          sponsorstudynumb,
          num_eudract,
          pays_etude
        ]);
        // console.log(res1)
        // Récupération l'ID généré lors de l'INSERT dans la table susar_eu
        const idSUSAR_EU = res1[0].insertId;
        
        // console.log ("idSUSAR_EU : ",idSUSAR_EU)
        
        // pour charger les médicaments
        const MedicsFiltre = MedicBNPV.filter(Medic => Medic.master_id === susar['master_id']);
        
        let tabLibHighLevelSubName = [];
        for (const Medic of MedicsFiltre) {
          
          // pour charger le high level substance name
          const objSubHighLevelFiltre = objSubLowLevel.filter(objSubLowLevel => objSubLowLevel.active_substance_low_level === Medic['substancename']);
          let highLevelSubName = "" 
          let tabHighLevelSubName = [];

          for (const highLevel of objSubHighLevelFiltre) {
            if (highLevelSubName.indexOf(highLevel['active_substance_high_level']) === -1) {

              // recherche dans le tableau des eval/SA_high_level : objIntSubDmm
              
              const objIntSubDmmFiltre = objIntSubDmm.filter(objIntSubDmm => objIntSubDmm.active_substance_high_level === highLevel['active_substance_high_level']);

              for (const IntSubDmm of objIntSubDmmFiltre) {
                // console.log(IntSubDmm['active_substance_high_level'])
                tabHighLevelSubName.push(IntSubDmm['id'])
              }

              // console.log (objIntSubDmmFiltre)
              // process.exit(0)
              
              // tableau pour creer les lignes dans la table substance_pt
              if (tabLibHighLevelSubName.indexOf(highLevel['active_substance_high_level']) === -1) {
                tabLibHighLevelSubName.push(highLevel['active_substance_high_level'])
              }

              if (highLevelSubName.length === 0) {
                highLevelSubName = highLevel['active_substance_high_level'];
              } else {
                highLevelSubName += '/' + highLevel['active_substance_high_level'];
              }
            }
          }


          
          // for (const highLevel of objSubHighLevelFiltre) {
          //   if (highLevelSubName.length == 0) {
          //     highLevelSubName = highLevel['active_substance_high_level']
          //   } else {
          //     highLevelSubName += "/" + highLevel['active_substance_high_level']
          //   }
          // }
  
          // // console.log(objSubhighLevelFiltre[0])
          // console.log(Medic['NBBlock'] + " : " + 
          //             Medic['NBBlock2'] + " - " +
          //             Medic['productname'] + " / " + 
          //             Medic['substancename'] + " (" +
          //             Medic['productcharacterization'] + ") - " + 
          //             highLevelSubName
          //             )

          // INSERT dans la table medicaments l'ID généré comme clé étrangère
          const SQL_insert_medicaments = "INSERT INTO medicaments ( " + 
          "susar_id," +
          "master_id," +
          "caseid," +
          "specificcaseid," +
          "dlpversion," +
          "productcharacterization," +
          "productname," +
          "substancename," +
          "active_substance_high_level," +
          "nbblock," +
          "nbblock2," +
          "created_at," +
          "updated_at " +
          ") VALUES (" +
          "? ," +
          "? ," +
          "? ," +
          "? ," +
          "? ," +
          "? ," +
          "? ," +
          "? ," +
          "? ," +
          "? ," +
          "? ," +
          "CURRENT_TIMESTAMP, " +
          "CURRENT_TIMESTAMP " +
          ");" 

          const res2 = await connectionSusarEu.query(SQL_insert_medicaments, [
            idSUSAR_EU,
            Medic['master_id'], 
            Medic['caseid'], 
            Medic['specificcaseid'], 
            Medic['DLPVersion'], 
            Medic['productcharacterization'], 
            Medic['productname'], 
            Medic['substancename'], 
            highLevelSubName, 
            Medic['NBBlock'], 
            Medic['NBBlock2']
          ]);
          
          // Récupération l'ID généré lors de l'INSERT dans la table medicaments : si un jour on décide de relier la table medicament et la table intervenant_substance_dmm
          // const idmedicaments = res1[0].insertId

          // On boucle sur la variable tabHighLevelSubName qui contient les id de la table intervenant_substance_dmm avec les active_substance_high_level que l'on souhaite

          for (const [idx, idIntSubDmm] of tabHighLevelSubName.entries()) {
            // console.log(idSUSAR_EU," ",idIntSubDmm)
            const isUniqueIntSubDmmSusar = await isUnique_intervenant_substance_dmm_susar_eu(connectionSusarEu,idSUSAR_EU,idIntSubDmm)
            if (isUniqueIntSubDmmSusar) {
              // INSERT dans la table de liaison susar_eu/intervenant_substance_dmm des ID des deux tables comme clefs étrangères
              const SQL_insert_intervenant_substance_dmm_susar_eu = "INSERT INTO intervenant_substance_dmm_susar_eu ( " +
                "susar_eu_id," +
                "intervenant_substance_dmm_id" +
                ") VALUES (" +
                "? ," +
                "? " +
                ");"
  
              const res2_2 = await connectionSusarEu.query(SQL_insert_intervenant_substance_dmm_susar_eu, [
                idSUSAR_EU,
                idIntSubDmm
              ])
            }
          }
        }
        
        // console.log(tabLibHighLevelSubName)

        // pour charger les effets indesirables
        // console.log ("Effets indesirables : ")
        const EIFiltre = EIBNPV.filter(EI => EI.master_id === susar['master_id']);

        let tabMeddraPt = []; 

        for (const EI of EIFiltre) {

          // Remplissage du tableau d'objet tabMeddraPt
          const objTempo = {
            codereactionmeddrapt: EI['codereactionmeddrapt'],
            reactionmeddrapt: EI['reactionmeddrapt']
          }
          const objExist = tabMeddraPt.some(objet => objet.codereactionmeddrapt === objTempo.codereactionmeddrapt 
                                                  && objet.reactionmeddrapt === objTempo.reactionmeddrapt);
          if (!objExist) {
            tabMeddraPt.push(objTempo)
          }
          // console.log(EI['codereactionmeddrapt'] + " : " + 
          //             EI['reactionmeddrapt']  + " (" + 
          //             EI['reactionstartdate'] + ")" 
          //             )

          // INSERT dans la table effets_indesirables l'ID généré comme clé étrangère
                      
          const SQL_insert_EI = "INSERT INTO effets_indesirables ( " + 
          "susar_id," +
          "master_id," +
          "caseid," +
          "specificcaseid," +
          "dlpversion," +
          "reactionstartdate," +
          "codereactionmeddrallt," +
          "reactionmeddrallt," +
          "codereactionmeddrapt," +
          "reactionmeddrapt," +
          "codereactionmeddrahlt," +
          "reactionmeddrahlt," +
          "codereactionmeddrahlgt," +
          "reactionmeddrahlgt," +
          "reactionmeddrasoc," +
          "soc," +
          "created_at," +
          "updated_at " +
          ") VALUES (" +
          "? ," +
          "? ," +
          "? ," +
          "? ," +
          "? ," +
          "? ," +
          "? ," +
          "? ," +
          "? ," +
          "? ," +
          "? ," +
          "? ," +
          "? ," +
          "? ," +
          "? ," +
          "? ," +
          "CURRENT_TIMESTAMP, " +
          "CURRENT_TIMESTAMP " +
          ");" 

          const res3 = await connectionSusarEu.query(SQL_insert_EI, [
            idSUSAR_EU,
            EI['master_id'], 
            EI['caseid'], 
            EI['specificcaseid'], 
            EI['DLPVersion'], 
            EI['reactionstartdate'],
            EI['codereactionmeddrallt'],
            EI['reactionmeddrallt'],
            EI['codereactionmeddrapt'], 
            EI['reactionmeddrapt'],
            EI['codereactionmeddrahlt'], 
            EI['reactionmeddrahlt'],
            EI['codereactionmeddrahlgt'],
            EI['reactionmeddrahlgt'],
            EI['reactionmeddrasoc'], 
            EI['soc'] 
          ]);
        }
        // console.log(tabMeddraPt)
  
        // pour charger les "medical history"
        // console.log ("Medical history : ")
        const MedHistFiltre = MedHistBNPV.filter(MedHist => MedHist.master_id === susar['master_id']);
        for (const MedHist of MedHistFiltre) {
          // if (MedHist['patientmedicalcomment']==='') {
          //   console.log(MedHist['code_PT'] + " : " + 
          //               MedHist['lib_PT']
          //               )
          // } else {
          //   console.log(MedHist['code_PT'] + " : " + 
          //               MedHist['lib_PT'] + " (" +
          //               MedHist['patientmedicalcomment'] + ")"
          //               )
          // }

          // INSERT dans la table effets_indesirables l'ID généré comme clé étrangère
          const SQL_insert_MedHist = "INSERT INTO medical_history ( " + 
          "susar_id," +
          "master_id," +
          "disease_lib_llt," +
          "disease_lib_pt," +
          "disease_code_llt," +
          "disease_code_pt," +
          "continuing," +
          "medicalcomment," +
          "created_at," +
          "updated_at " +
          ") VALUES (" +
          "? ," +
          "? ," +
          "? ," +
          "? ," +
          "? ," +
          "? ," +
          "? ," +
          "? ," +
          "CURRENT_TIMESTAMP, " +
          "CURRENT_TIMESTAMP " +
          ");" 

          const res4 = await connectionSusarEu.query(SQL_insert_MedHist, [
            idSUSAR_EU,
            MedHist['master_id'], 
            MedHist['lib_LLT'], 
            MedHist['lib_PT'], 
            MedHist['code_LLT'], 
            MedHist['code_PT'],
            MedHist['patientmedicalcontinue'],
            MedHist['patientmedicalcomment']
          ]);
        }

        // on boucle sur les substances - tabLibHighLevelSubName :
        for (const LibHighLevelSubName of tabLibHighLevelSubName) {

          // on boucle sur les EI_PT - tabMeddraPt (codereactionmeddrapt,reactionmeddrapt)
          for (const MeddraPt of tabMeddraPt) {

            // console.log (LibHighLevelSubName,MeddraPt.codereactionmeddrapt)
            
            // requete dans la table substance_pt pour voir si le couple substance/CodePT n'existe pas déja 
            const id_substance_pt_2 = await isAlreadyExist_substance_pt(connectionSusarEu,LibHighLevelSubName,MeddraPt.codereactionmeddrapt)
            let id_substance_pt = null
            if (id_substance_pt_2 != null) {
              id_substance_pt = id_substance_pt_2
              //      - si OUI : - on récupère substance_pt.id
              //                 - creation d'une ligne dans la table substance_pt_susar_eu avec :
              //                    - susar_eu_id = idSUSAR_EU
              //                    - substance_pt_id = substance_pt.id
            } else {
              //      - si NON : - on crée une ligne dans substance_pt.id
              //                 - on récupère substance_pt.id ainsi crée
              //                 - creation d'une ligne dans la table substance_pt_susar_eu avec :
              //                    - susar_eu_id = idSUSAR_EU
              //                    - substance_pt_id = substance_pt.id
              const SQL_insert_substance_pt = "INSERT INTO substance_pt ( " + 
                        "active_substance_high_level," +
                        "codereactionmeddrapt," +
                        "reactionmeddrapt," +
                        "created_at," +
                        "updated_at " +
                        ") VALUES (" +
                        "? ," +
                        "? ," +
                        "? ," +
                        "CURRENT_TIMESTAMP, " +
                        "CURRENT_TIMESTAMP " +
                        ");"
              const res_insert_substance_pt = await connectionSusarEu.query(SQL_insert_substance_pt, [
                LibHighLevelSubName,
                MeddraPt.codereactionmeddrapt, 
                MeddraPt.reactionmeddrapt
              ]);
              id_substance_pt = res_insert_substance_pt[0].insertId;
            }
            
            const SQL_insert_substance_pt_susar_eu = "INSERT INTO substance_pt_susar_eu ( " + 
                      "substance_pt_id," +
                      "susar_eu_id" +
                      ") VALUES (" +
                      "? ," +
                      "? " +
                      ");"
            const res_insert_substance_pt_susar_eu = await connectionSusarEu.query(SQL_insert_substance_pt_susar_eu, [
              id_substance_pt,
              idSUSAR_EU
            ]);


          } 
        }


        // const res5 = await Promise.all([res2, res3, res4]);
      } else {

        logger.warn('pas d\'import pour ce SUSAR, il existait déjà dans la SUSAR_EU : ' +
                    susar['master_id'] + " - " + 
                    susar['specificcaseid'] + " - " + 
                    susar['DLPVersion'])
      }
    }
    
  logger.info("Nombre de SUSAR importés : " + iSUSAR_importes)

/*************************************************************************************** */

    // commit de la transaction
    await connectionSusarEu.commit();
  } catch (error) {
    // rollback de la transaction en cas d'erreur
    await connectionSusarEu.rollback();
    throw error;
  }
}



/**
 * début de la requete dans SUSAR_EU pour récupérer la liste des low-level substance name
 * 
 * @param {Connection} connectionSusarEu 
 * @returns {Promise<
 * Array<[
 *    active_substance_grouping[], 
 *    String[]
 * ]>>} [objSubLowLevel,lstSubLowLevel] : reourne un tableau :
 *            - objSubLowLevel : Objet : contenu du résultat de la requête vers la table high-level/low-level substance name
 *            - lstSubLowLevel : Tableau : liste des low-level substance name
 */
const donne_lstSubLowLevel = async (connectionSusarEu) => {

  const objSubLowLevel = await donne_objSubLowLevel(connectionSusarEu)

  const lstSubLowLevel = objSubLowLevel.map(obj => obj.active_substance_low_level);
  
  return [objSubLowLevel,lstSubLowLevel];
  // return Promise.resolve([objSubLowLevel,lstSubLowLevel]);

}

/**
 * Dans la BNPV les critères de gravité sont stockés avec des doublons et séparé par deux tildes ~~
 * cette methode enlève les doublons et met un saut de ligne HTMH comme séparateur entre deux critères
 * 
 * @param {string} SeriousnessCriteria_brut : chaine contenant les criteres de gravité séparés par deux tildes ~~
 * @returns {Promise<string>} : chaine contenant les critères de gravité sans doublon et séparés par un <BR>
 */
const donne_lstSeriousnessCriteria = async (SeriousnessCriteria_brut) => {
  const tabSeriousnessCriteria_brut = SeriousnessCriteria_brut.split("~~")
  if (tabSeriousnessCriteria_brut.length != 0) {
    return tabSeriousnessCriteria_brut.reduce ((accumulator,Crit_encourt)=>{
      if (!accumulator .includes(Crit_encourt)) {
        return accumulator  + Crit_encourt + '<BR>';
      }
      return accumulator ; 
    },'')
  } else {
    return ""
  }
}

export { 
    donne_objSubLowLevel,
    effaceTablesSUSAR_EU,
    insertDataSUSAR_EU,
    donne_lstSubLowLevel
};