/**
 * @typedef {import('../types').active_substance_grouping} active_substance_grouping
 * @typedef {import('../types').susar_eu} susar_eu
 * @typedef {import('../types').medicaments} medicaments
 * @typedef {import('../types').effets_indesirables} effets_indesirables
 * @typedef {import('../types').medical_history} medical_history
 * @typedef {import('../types').donnees_etude} donnees_etude
 * 
 */


/**
 * donne_objSubLowLevel : récupération de la table de correspondance high level / low level
 * 
 * @param {Connection} connectionSusarEu 
 * @returns {Array<[active_substance_grouping[]]>} retourne un tableau d'objet active_substance_grouping :
 *            - contenu du résultat de la requête vers la table high-level/low-level substance name
 */
async function  donne_objSubLowLevel (connectionSusarEu) {
    const results = await connectionSusarEu.query(
      'SELECT * FROM active_substance_grouping WHERE active_substance_grouping.inactif = 0 ;'
    );
    // console.log(results[0][0])
    // console.log(results[0])
    // const lstSubLowLevel = results[0].map(obj => obj.active_substance_high_le_low_level);

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
      const [resu_2, resu_3, resu_4, resu_5, resu_6] = await Promise.all([res_2, res_3, res_4, res_5, res_6]);
      const resu_7 = await connectionSusarEu.query('SET FOREIGN_KEY_CHECKS = 1;');
    } catch (err) {
      console.error(erreur);
    } finally {
      // await closePoolSusarEu(poolSusarEu)
    }
  }
  


/**
 * isSUSAR_EU_unique : Avant insertion d'une ligne dans la table susar_eu,
 *        cette fonction vérifie que la ligne n'exite pas déjà
 * 
 * @param {Connection} connectionSusarEu 
 * @param {number} master_id 
 * @param {string} specificcaseid 
 * @param {number} DLPVersion 
 * @returns {boolean} : retourne un booléen, si TRUE le susar n'existe pas, on pourra le créer 
 *                                 si FALSE le susar existe, il ne faudra pas le créer
 */
async function isSUSAR_EU_unique (connectionSusarEu,master_id,specificcaseid,DLPVersion) {
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

    // début de la transaction
    await connectionSusarEu.beginTransaction();
    
    /*************************************************************************************** */        
    
    // boucle pour les INSERT dans les différentes tables 
    let i = 0
    
    for (const susar of lstSusarBNPV) {
      i++
      
      // pour tester, sort après xx susars
      if (i>50) {
        break
      }
      console.log(susar['master_id'])

      // vérification avec les INSERT d'un SUSAR et des ses enregistrements liés :
      //      - On regarde que "susar['master_id']" n'existe pas déjà dans la table "susar_eu"
      //      - On regarde que "susar['specificcaseid'] AND susar['DLPVersion']" n'existe pas déjà dans la table "susar_eu"
      const isUnique = await isSUSAR_EU_unique (connectionSusarEu,susar['master_id'],susar['specificcaseid'],susar['DLPVersion'])

      if (isUnique) {
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
        // Récupérez l'ID généré lors du premier INSERT
        const idSUSAR_EU = res1[0].insertId;
        
        // console.log ("idSUSAR_EU : ",idSUSAR_EU)
        
        // pour charger les médicaments
        const MedicsFiltre = MedicBNPV.filter(Medic => Medic.master_id === susar['master_id']);
  
        for (const Medic of MedicsFiltre) {
          
          // pour charger le high level substance name
          const objSubHighLevelFiltre = objSubLowLevel.filter(objSubLowLevel => objSubLowLevel.active_substance_high_le_low_level === Medic['substancename']);
          let highLevelSubName = "" 
          for (const highLevel of objSubHighLevelFiltre) {
            if (highLevelSubName.length == 0) {
              highLevelSubName = highLevel['active_substance_high_level']
            } else {
              highLevelSubName += "/" + highLevel['active_substance_high_level']
            }
          }
  
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

        }
  
  
        // pour charger les effets indesirables
  
        // console.log ("Effets indesirables : ")
        const EIFiltre = EIBNPV.filter(EI => EI.master_id === susar['master_id']);
        for (const EI of EIFiltre) {
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
        

        // const res5 = await Promise.all([res2, res3, res4]);



      }



  }



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
 * @returns {Array<[
 *    active_substance_grouping[], 
 *    String[]
 * ]>} [objSubLowLevel,lstSubLowLevel] : reourne un tableau :
 *            - objSubLowLevel : Objet : contenu du résultat de la requête vers la table high-level/low-level substance name
 *            - lstSubLowLevel : Tableau : liste des low-level substance name
 */
const donne_lstSubLowLevel = async (connectionSusarEu) => {

  const objSubLowLevel = await donne_objSubLowLevel(connectionSusarEu)
  // console.log(objSubLowLevel)

  const lstSubLowLevel = objSubLowLevel.map(obj => obj.active_substance_high_le_low_level);

  return [objSubLowLevel,lstSubLowLevel];

}



export { 
    donne_objSubLowLevel,
    effaceTablesSUSAR_EU,
    isSUSAR_EU_unique,
    insertDataSUSAR_EU,
    donne_lstSubLowLevel
};