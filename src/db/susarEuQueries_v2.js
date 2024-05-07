
import {
  logStream , 
  logger
} from '../logs_config.js'




/**
 * @typedef {import('../types').objIntSubDmm} objIntSubDmm
 * 
 */

/**
 * 
 * @param {Array<susar_eu>} LstSusarBNPV 
 * @returns {Promise<Array<number>>}
 */
const donne_lstMasterId = async (LstSusarBNPV) => {
  return LstSusarBNPV.map(obj => obj.master_id)
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
 * donne_objIntSubDmm : retourne un tableau d'objet avec les HL et LL substance, ainsi qu'un tableau de substance associées le cas échéant
 * 
 * @param {Connection} connectionSusarEu 
 * @returns {Promise<Array <objIntSubDmm>>}
 * 
 */
async function donne_objIntSubDmm (connectionSusarEu) {

    const results = await connectionSusarEu.query(
      "SELECT isd.id AS id_int_sub, " +
              "asg.id AS id_act_grp, " +
              "isd.active_substance_high_level, " +
              "asg.active_substance_low_level, " +
              "isd.association_de_substances " +
        "FROM intervenant_substance_dmm AS isd " +
        "LEFT JOIN active_substance_grouping AS asg ON asg.int_sub_dmm_id = isd.id " +
        "WHERE isd.inactif = FALSE  " +
        " AND asg.inactif = FALSE	 " +
        "ORDER BY asg.active_substance_high_level, " +
                "asg.active_substance_low_level, " +
                "isd.active_substance_high_level ;"
    );

    // gestion de l'element "ass_tab_LL" de cet objet : liste des substances associées 
    for (const intSub of results[0]) {
      if (intSub.association_de_substances) {
        // il s'agit d'une association de substance, on récupère ces substances sous forme de tableau, qu'on ajoutera a l'objet
        const res_ass_LL = await connectionSusarEu.query(
          "SELECT * " +
          "FROM intervenant_substance_dmmsubstance isds " + 
          "WHERE isds.intervenant_substance_dmm_id = " + intSub.id_int_sub
        );
        const LL = res_ass_LL[0].map(obj => obj.active_substance_low_level)
        intSub.ass_tab_LL = LL;
      } else {
        // il ne s'agit pas d'une association de substance, on ajoute a l'objet un élément vide
        intSub.ass_tab_LL = [];
      }
    } 
    return results[0]
}


/**
 * getSusarBNPV : récupération des SUSARs dans la BNPV
 * 
 * @param {Connection} connectionSafetyEasy 
 * @param {Array<objIntSubDmm>} lstObjLowLevel : tableau des low-level substance name suivis par la France
 * @param {Date} datePivotStatus : date pivot pour calculer le "statusDate between ...
 * @param {number} NbJourAvant : nombre de jour à retrancher à la date pivot pour calculer le "statusDate between ...
 * @param {number} NbJourApres : nombre de jour à ajouter à la date pivot pour calculer le "statusDate between ... 
 * @param {boolean} assSub : Flag indiquant si il s'agit d'une association de substances ou pas
 * @returns {Promise<Array<susar_eu>>} : une promesse de tableau d'objet avec la liste des susars
 */
async function getSusarBNPV_v2(connectionSafetyEasy, lstSubLowLevel, datePivotStatus, NbJourAvant, NbJourApres, assSub) {
  // const connectionSafetyEasy = await poolSafetyEasy.getConnection();

  // console.log (lstObjLowLevel)
  // // On fait un tableau avec les Low Level
  // const lstSubLowLevel = lstObjLowLevel.map(obj => obj.active_substance_low_level)
// console.log (lstSubLowLevel)
// process.exit(0)
  // permet de remplacer les "simples quote" en "antislash + simple quote" ce qui permet d'échapper les simple quote dans le SQL 
  const lstSubLowLevelEscaped = lstSubLowLevel.map(name => name.replace(/'/g, "\\'"));



  // Ajoute des simple quote de part et d'autre de chaque élément du tableau pour générer un WHERE ... IN (...)
  const substanceNames = lstSubLowLevelEscaped.map(name => "'" + name + "'").join(',');
  // permet de rechercher les EC dont le status date est compris entre 3 jours avant et 3 jours après la date du jour

// console.log(substanceNames)
// return
  // formatage des date pour la requête
  const jourAvant = new Date(datePivotStatus - NbJourAvant * 24 * 60 * 60 * 1000);
  const jourApres = new Date(datePivotStatus + NbJourApres * 24 * 60 * 60 * 1000);
  const startDate = jourAvant.toISOString().slice(0, 10) + " 00:00:00"
  const endDate = jourApres.toISOString().slice(0, 10) + " 23:59:59"

  let SQL_sous_Req = ""

  if (assSub) {
    // sous requete pour les associations de substances associées

    SQL_sous_Req = "SELECT DISTINCT mv.id as id_prod " +
                                    "FROM master_versions mv " +
                              "INNER JOIN bi_product pr ON mv.id = pr.master_id " +
                               "LEFT JOIN bi_product_substance su ON pr.master_id = su.master_id AND pr.NBBlock = su.NBBlock " +
                                   "WHERE 1 = 1 " +
                                     "AND specificcaseid LIKE 'EC%' AND su.substancename IN  (" + substanceNames + ") " +
                                    "AND (pr.productcharacterization = 'Suspect' OR pr.productcharacterization = 'Interacting') " +
                                    "AND mv.Deleted = 0 " +
                               "GROUP BY mv.id " +
                                 "HAVING COUNT(DISTINCT su.substancename) = " + lstSubLowLevel.length
  } else 
  {
    SQL_sous_Req = "SELECT DISTINCT mv.id as id_prod " +
                                    "FROM master_versions mv " +
                              "INNER JOIN bi_product pr ON mv.id = pr.master_id " +
                               "LEFT JOIN bi_product_substance su ON pr.master_id = su.master_id AND pr.NBBlock = su.NBBlock " +
                                   "WHERE 1 = 1 " +
                                     "AND specificcaseid LIKE 'EC%' AND su.substancename IN  (" + substanceNames + ") " +
                                    "AND (pr.productcharacterization = 'Suspect' OR pr.productcharacterization = 'Interacting') " +
                                    "AND mv.Deleted = 0"
  }

  const SQL = "SELECT DISTINCT " +
                  "id.master_id, mv.caseid, mv.specificcaseid, mv.DLPVersion, mv.creationdate, mv.statusdate, " +
                  "id.worldwideuniquecaseidentificationnumber, " +
                  "ci.iscaseserious, ci.seriousnesscriteria, ci.receivedate, " +
                  "mo.receiptdate, " +
                  "pa.patientsex, pa.patientonsetage, pa.patientonsetageunitlabel, pa.patientagegroup, " +
                  "ps.reportercountry pays_survenue, " +
                  "na.narrativeincludeclinical, " +
                  "cs.casesummarylanguage, cs.casesummary " +
              "FROM master_versions mv " +
              "LEFT JOIN bi_study st ON mv.id = st.master_id " +
              "LEFT JOIN bi_study_registration sr ON mv.id = sr.master_id " +
              "INNER JOIN bi_identifiers id ON mv.id = id.master_id " +
              "INNER JOIN bi_caseinfo ci ON mv.id = ci.master_id " +
              "INNER JOIN (SELECT master_id, MAX(receiptdate) AS receiptdate FROM bi_mostrecentinformation GROUP BY master_id) AS mo ON mv.id = mo.master_id " +
              "INNER JOIN bi_patientinformations pa ON mv.id = pa.master_id " +
              "INNER JOIN bi_primarysource ps ON mv.id = ps.master_id " +
              "LEFT JOIN bi_narrative na ON mv.id = na.master_id " +
              "LEFT JOIN bi_case_summary cs ON mv.id = cs.master_id " +
              "WHERE 1 = 1 " +
                  "AND specificcaseid LIKE 'EC%' " +
                  "AND mv.StatusDate BETWEEN '" + startDate + "' AND '" + endDate + "' " +
                  "AND ci.casenullification <> 'Nullification' " +
                  "AND ps.primarysourceforregulatorypurposes LIKE 'Yes' " +
                  "AND mv.id IN (" + SQL_sous_Req + ") " + 
                  "ORDER BY mv.id;"

// console.log(SQL)
// process.exit(0)

  const [LstSusarBNPV, champs] = await connectionSafetyEasy.query(SQL);
  // console.log(LstSusarBNPV[0])
  connectionSafetyEasy.release();
  return  LstSusarBNPV ;
}



/**
 * getMedicBNPV : récupération des médicaments des SUSARs dans la BNPV
 * 
 * @param {Connection} connectionSafetyEasy 
 * @param {Array<number>} lstMasterId : tableau des masterId recherchés
 * @returns {Promise<Array<medicaments>>} : un tableau d'objet medicaments 
 */
async function getMedicBNPV_v2(connectionSafetyEasy, lstMasterId ) {

  const SQL = "SELECT DISTINCT " + 
                  "pr.master_id, " + 
                  "mv.caseid, " + 
                  "mv.specificcaseid, " + 
                  "mv.DLPVersion, " + 
                  "pr.productcharacterization, " + 
                  "TRIM(REPLACE(pr.productname, '\\n', '')) productname, " + 
                  "pr.NBBlock, " + 
                  "su.substancename, " + 
                  "su.NBBlock2 " + 
              "FROM master_versions mv " + 
              "INNER JOIN bi_product pr ON mv.id = pr.master_id " + 
              "LEFT JOIN bi_product_substance su ON pr.master_id = su.master_id AND pr.NBBlock = su.NBBlock " + 
              "WHERE " + 
                  "1 = 1 " + 
                  "AND specificcaseid LIKE 'EC%' " + 
                  // "AND (pr.productcharacterization = 'Suspect' OR pr.productcharacterization = 'Interacting') " +
                  "AND mv.id IN ( " + lstMasterId + ") " + 
                  "AND mv.Deleted = 0; "
  
  const [Medic, champs] = await connectionSafetyEasy.query(SQL);

  return Medic ;
}


/**
 * getEIBNPV : récupération des effets indésireables des SUSARs dans la BNPV
 * 
 * @param {Connection} connectionSafetyEasy 
 * @param {Array<number>} lstMasterId : tableau des masterId recherchés
 * @returns {Promise<Array<effets_indesirables>>} : un tableau d'objet effets_indesirables 
 */
async function getEIBNPV_v2(connectionSafetyEasy, lstMasterId ) {

  const SQL = "SELECT DISTINCT " +
                  "re.master_id, " +
                  "mv.caseid, " +
                  "mv.specificcaseid, " +
                  "mv.DLPVersion, " +
                  "re.reactionstartdate, " +
                  "re.reactionmeddrallt, " +
                  "re.codereactionmeddrallt, " +
                  "re.reactionmeddrapt, " +
                  "re.codereactionmeddrapt, " +
                  "re.reactionmeddrahlt, " +
                  "re.codereactionmeddrahlt, " +
                  "re.reactionmeddrahlgt, " +
                  "re.codereactionmeddrahlgt, " +
                  "re.soc, " +
                  "re.reactionmeddrasoc " +
              "FROM master_versions mv " +
              "INNER JOIN bi_reaction re ON mv.id = re.master_id " +
              "WHERE " +
                  "1 = 1 " +
                  "AND specificcaseid LIKE 'EC%' " +
                  "AND mv.id IN ( " + lstMasterId + ") " + 
                  "AND mv.Deleted = 0; ";


  const [EI, champs] = await connectionSafetyEasy.query(SQL);

  return  EI ;
}



/**
 * getMedHistBNPV : récupération des "medical history" des SUSARs dans la BNPV
 * 
 * @param {Connection} connectionSafetyEasy 
 * @param {Array<number>} lstMasterId : tableau des masterId recherchés
 * @returns {Promise<Array<medical_history>>} : un tableau d'objet medical_history
 */
async function getMedHistBNPV_v2(connectionSafetyEasy, lstMasterId ) {

  const SQL = "SELECT DISTINCT " + 
                  "master_id, " + 
                  "patientepisodenameasreported, " + 
                  "patientepisodecode code_LLT, " + 
                  "patientepisodename lib_LLT, " + 
                  "codepatientepisodemeddrapt code_PT, " + 
                  "patientepisodemeddrapt lib_PT, " + 
                  "patientepisodesoccode, " + 
                  "patientepisodesocname, " + 
                  "patientepisodenamemeddraversion, " + 
                  "patientmedicalcontinue, " + 
                  "patientmedicalenddate, " + 
                  "patientmedicalstartdate, " + 
                  "familyhistory, " + 
                  "patientmedicalcomment " + 
              "FROM bi_medhistory " + 
              "WHERE master_id  IN ( " + lstMasterId + ") " ;

  const [MedHist, champs] = await connectionSafetyEasy.query(SQL);

  return  MedHist ;
}



/**
 * getDonneesEtudeBNPV : récupération des données de l'essai clinique dans la BNPV
 * 
 * @param {Connection} connectionSafetyEasy 
 * @param {Array<number>} lstMasterId : tableau des masterId recherchés
 * @returns {Promise<Array<donnees_etude>>} : un tableau d'objet donnees_etude 
 */
async function getDonneesEtudeBNPV_v2(connectionSafetyEasy, lstMasterId ) {


  const SQL = "SELECT DISTINCT " + 
                  "st.master_id, " + 
                  "mv.caseid, " + 
                  "mv.specificcaseid, " + 
                  "mv.DLPVersion, " +
                  "st.studytitle, " + 
                  "st.sponsorstudynumb, " +
                  "sr.studyname num_eudract, " + 
                  "sr.studyregistrationcountry pays_etude " +
              "FROM master_versions mv " +
              "LEFT JOIN bi_study st ON mv.id = st.master_id " +
              "LEFT JOIN bi_study_registration sr ON mv.id = sr.master_id " + 
              "WHERE " + 
                  "1 = 1 " + 
                  "AND specificcaseid LIKE 'EC%' " + 
                  "AND sr.studyregistrationcountry = 'EU' " + 
                  "AND mv.id IN ( " + lstMasterId + ") " + 
                  "AND mv.Deleted = 0; "
  // console.log(SQL)
  const [DonneesEtude, champs] = await connectionSafetyEasy.query(SQL);


  return DonneesEtude ;
}



/**
 * getIndicationBNPV : récupération des "indications" des SUSARs dans la BNPV
 * 
 * @param {Connection} connectionSafetyEasy 
 * @param {Array<number>} lstMasterId : tableau des masterId recherchés
 * @returns {Promise<Array<indication>>} : un tableau d'objet indication 
 */
async function getIndicationBNPV_v2(connectionSafetyEasy, lstMasterId ) {

  const SQL = "SELECT DISTINCT " +
                  "pr.master_id, " +
                  "TRIM(REPLACE(pr.productname, '\\n', '')) productname, " +
                  "id.productindication, " +
                  "id.codeproductindication, " +
                  "pr.productcharacterization " +
              "FROM master_versions mv " +
              "INNER JOIN bi_product pr ON mv.id = pr.master_id " +
              "LEFT JOIN bi_product_indication id ON pr.master_id = id.master_id " +
                  "AND pr.NBBlock = id.NBBlock " +
              "WHERE " +
                  "1 = 1 " +
                  "AND specificcaseid LIKE 'EC%' " +
                  "AND mv.id IN ( " + lstMasterId + ") " +
                  "AND pr.productcharacterization = 'Suspect'"

  const [Indication, champs] = await connectionSafetyEasy.query(SQL);

  return  Indication ;
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
 * @param {Array <objIntSubDmm>} lstObjIntSubDmm : tableau d'objet avec les HL, LL et substances associées à importer
 * @param {susar_eu[]} lstSusarBNPV 
 * @param {medicaments[]} MedicBNPV 
 * @param {effets_indesirables[]} EIBNPV 
 * @param {medical_history[]} MedHistBNPV 
 * @param {donnees_etude[]} DonneesEtudeBNPV 
*/
async function insertDataSUSAR_EU_v2(connectionSusarEu,lstObjIntSubDmm,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV,DonneesEtudeBNPV,IndicationBNPV) {
  try {

    // récupération de la liste des intervenant_substance_dmm
    const objIntSubDmm = await donne_objIntSubDmm (connectionSusarEu) 

    // On stock les High Level et l'id correspondant dans la table intervenantSubstanceDMM
    const highLevelSubName = lstObjIntSubDmm[0].active_substance_high_level
    const id_int_sub = lstObjIntSubDmm[0].id_int_sub

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
                                                  "date_import, " +
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
        
        // console.log ("lstObjIntSubDmm[0] : ", lstObjIntSubDmm[0])

        // let tabLibHighLevelSubName = [];
        for (const Medic of MedicsFiltre) {
          
          let highLevelSubName_PourInsert = ""
          let id_int_sub_PourInsert = ""
          let assSub = false
          // let tabHighLevelSubName = [];


          if (lstObjIntSubDmm[0].association_de_substances) {
            assSub = true
            // association de substance - on regarde dans lstObjIntSubDmm[0].ass_tab_LL
            let subExiste = false;

            lstObjIntSubDmm.forEach(obj => {
              for (let i = 0; i < obj.ass_tab_LL.length; i++) {
                if (obj.ass_tab_LL[i] === Medic['substancename']) {
                  subExiste = true;
                  break;
                }
              }
            });
            if (subExiste) {
              // Le 'substancename' du Medic en cours est présent dans la liste des substances associées, pour ce médicament, 
              // on va donc enregistrer le High Level correspondant en definissant la variable "highLevelSubName"
              highLevelSubName_PourInsert = highLevelSubName 
              id_int_sub_PourInsert = id_int_sub
            } else {
              // On n'est pas rapporteur sur ce medic => on ne stock pas le High Level
              highLevelSubName_PourInsert = null 
              id_int_sub_PourInsert = null
            }
          } else {
            assSub = false
            // ce n'est pas une association de substance - on regarde dans lstObjIntSubDmm.active_substance_low_level
            if (lstObjIntSubDmm.some(obj => obj.active_substance_low_level === Medic['substancename'])) {
              // Le 'substancename' du Medic en cours est présent dans la liste des Low Level, pour ce médicament, 
              // on va donc enregistrer le High Level correspondant en definissant la variable "highLevelSubName"
              highLevelSubName_PourInsert = highLevelSubName  
              id_int_sub_PourInsert = id_int_sub
            } else {
              // On n'est pas rapporteur sur ce medic => on ne stock pas le High Level
              highLevelSubName_PourInsert = null  
              id_int_sub_PourInsert = null
            }
          }

          // id_int_sub = null

          // // console.log("Medic['productcharacterization'] : ", Medic['productcharacterization'])
          // if (Medic['productcharacterization'] === 'Suspect' || Medic['productcharacterization'] === 'Interacting') {

          //   // ici il faut faire des modif pour :
          //   //    - recupérer le/les High Level substances name dans le tableau lstObjIntSubDmm et le mettre dans la variable highLevelSubName => qui sera mis dans le champ medicaments.active_substance_high_level
          //   highLevelSubName = lstObjIntSubDmm[0].active_substance_high_level
          //   //    - l'id_int_sub pour mettre dans le champ medicaments.intervenant_substance_dmm_id mettre dans une variable id_int_sub
          //   id_int_sub = lstObjIntSubDmm[0].id_int_sub
          //   //    - le statut "association de substance" pour mettre dans le champ medicaments.association_de_substances mettre dans une variable assSub
          //   assSub = lstObjIntSubDmm[0].association_de_substances

          // }

          // console.log ("highLevelSubName_PourInsert : ",highLevelSubName_PourInsert)
          // console.log ("id_int_sub_PourInsert : ",id_int_sub_PourInsert)
          // console.log ("assSub : ",assSub)
          // console.log ("Substance en cours : ",Medic['substancename'])

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
          "intervenant_substance_dmm_id," +
          "association_de_substances," +
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
          "? ," +
          "? ," +
          "CURRENT_TIMESTAMP, " +
          "CURRENT_TIMESTAMP " +
          ");" 

          // console.log (Medic['productcharacterization'])

          const res2 = await connectionSusarEu.query(SQL_insert_medicaments, [
            idSUSAR_EU,
            Medic['master_id'], 
            Medic['caseid'], 
            Medic['specificcaseid'], 
            Medic['DLPVersion'], 
            Medic['productcharacterization'], 
            Medic['productname'], 
            Medic['substancename'], 
            highLevelSubName_PourInsert, 
            id_int_sub_PourInsert, 
            assSub, 
            Medic['NBBlock'], 
            Medic['NBBlock2']
          ]);
          
          if (id_int_sub_PourInsert !== null) {
            
            const isUniqueIntSubDmmSusar = await isUnique_intervenant_substance_dmm_susar_eu(connectionSusarEu,idSUSAR_EU,id_int_sub_PourInsert)
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
                id_int_sub_PourInsert
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

        // pour charger les "indication"
        // console.log ("Medical history : ")
        const IndicationFiltre = IndicationBNPV.filter(IndicationBNPV => IndicationBNPV.master_id === susar['master_id']);
        for (const Indication of IndicationFiltre) {
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
          const SQL_insert_Indication = "INSERT INTO indications ( " + 
          "susar_id," +
          "master_id," +
          "product_name," +
          "product_indications," +
          "product_indications_eng," +
          "code_product_indications," +
          "productcharacterization," +
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
          "CURRENT_TIMESTAMP, " +
          "CURRENT_TIMESTAMP " +
          ");" 

          const res5 = await connectionSusarEu.query(SQL_insert_Indication, [
            idSUSAR_EU,
            Indication['master_id'], 
            Indication['productname'], 
            Indication['productindication'], 
            '', 
            Indication['codeproductindication'],
            Indication['productcharacterization']
          ]);
        }

        // on boucle sur les substances - tabLibHighLevelSubName :
        // for (const LibHighLevelSubName of tabLibHighLevelSubName) {

          
          // on boucle sur les EI_PT - tabMeddraPt (codereactionmeddrapt,reactionmeddrapt)
          for (const MeddraPt of tabMeddraPt) {

            // console.log (LibHighLevelSubName,MeddraPt.codereactionmeddrapt)
            
            // requete dans la table substance_pt pour voir si le couple substance/CodePT n'existe pas déja 
            const id_substance_pt_2 = await isAlreadyExist_substance_pt(connectionSusarEu,highLevelSubName,MeddraPt.codereactionmeddrapt)
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
                highLevelSubName,
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

        // const res5 = await Promise.all([res2, res3, res4]);
      } else {

/*****************************************************************************************************************************************************
 * 
 * Le SUSAR existe déjà dans la base, on ne le crée par deux fois, 
 * mais il faut regarder si les médicaments stockés dans SUSAR_EU correspondent au HL en cours, et ainsi ajouter ce HL aux medicaments correspondant
 * 
 * 
 *****************************************************************************************************************************************************/


        const assSub = lstObjIntSubDmm[0].association_de_substances

        // console.log(lstSubLowLevel)

        const tabObjMed = await donne_medicament_by_master_id (connectionSusarEu,susar['master_id'])

        // console.log(tabObjMed)
        // console.log(tabObjEI)

        let tabObjMed_HL= ""    // tabObjMed_HL contiendra un tableau d'objet de la table "susar_eu_v2.medicaments" filtré sur ceux a mettre a jour ()
        if (assSub) {
          // association de substance
          tabObjMed_HL = await donneObjMed_HL_AssSub_pour_MAJ (tabObjMed,lstObjIntSubDmm[0].ass_tab_LL)
        } else {
          // pas d'association de substance
          tabObjMed_HL = tabObjMed.filter(obj =>
            lstObjIntSubDmm.some(sub => sub.active_substance_low_level === obj.substancename)
          );
        }
        // tabObjMed_HL est la liste des médicaments dans SUSAR_EU 
        for (const ObjMed_HL of tabObjMed_HL) {

          // Mise a jour la table medicament pour tous les objets tabObjMed_HL, en utilisant tabObjMed_HL.id
          const idSUSAR_EU = ObjMed_HL.susar_id;
          const SQL_medicament = `UPDATE medicaments
          SET medicaments.active_substance_high_level = ?,
          medicaments.intervenant_substance_dmm_id = ?,
              medicaments.association_de_substances = ?,
              medicaments.updated_at = CURRENT_TIMESTAMP
              WHERE medicaments.id = ${ObjMed_HL.id};`

              const res_upt_medicament = await connectionSusarEu.query(SQL_medicament, [highLevelSubName,id_int_sub,assSub])

              if(res_upt_medicament[0].affectedRows > 0) {
                
                if (id_int_sub !== null) {
                  
                  const isUniqueIntSubDmmSusar = await isUnique_intervenant_substance_dmm_susar_eu(connectionSusarEu,idSUSAR_EU,id_int_sub)
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
                      id_int_sub
                    ])
              }
            }
            
            // la MAJ a fonctionné => Il faut regarder que pour chaque objet de tabObjEI, on a bien un couple medicament/substance dans la table substance_pt :
            // sinon on crée la ligne dans cette table "substance_pt" et on ajoute une entrée dans la table de liaison substance_pt_susar_eu
            const tabMeddraPt = await donne_effets_indesirables_by_master_id (connectionSusarEu,susar['master_id'])
            
            // on boucle sur les EI_PT - tabMeddraPt (codereactionmeddrapt,reactionmeddrapt)
            for (const MeddraPt of tabMeddraPt) {

              // requete dans la table substance_pt pour voir si le couple substance/CodePT n'existe pas déja 
              const id_substance_pt_2 = await isAlreadyExist_substance_pt(connectionSusarEu,highLevelSubName,MeddraPt.codereactionmeddrapt)
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
                  highLevelSubName,
                  MeddraPt.codereactionmeddrapt, 
                  MeddraPt.reactionmeddrapt
                ]);
                id_substance_pt = res_insert_substance_pt[0].insertId;
              }

              const Exist_substance_pt_susar_eu = await isAlreadyExist_substance_pt_susar_eu (connectionSusarEu,id_substance_pt,idSUSAR_EU)
              // console.log (Exist_substance_pt_susar_eu)

              if (Exist_substance_pt_susar_eu === null ) {
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
          }
        }

        logger.warn('pas d\'import pour ce SUSAR, il existait déjà dans la SUSAR_EU : ' +
                    susar['master_id'] + " - " + 
                    susar['specificcaseid'] + " - " + 
                    susar['DLPVersion'])
      }
    }
    
  logger.info("Nombre de SUSAR importés : " + iSUSAR_importes)

    // commit de la transaction
    await connectionSusarEu.commit();
  } catch (error) {
    // rollback de la transaction en cas d'erreur
    await connectionSusarEu.rollback();
    throw error;
  }
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
 * 
 * @param {Connection} connectionSusarEu 
 * @param {number} substance_pt_id : substance active (high level)
 * @param {number} susar_eu_id : susar_eu.id
 * @returns {Promise<null|number>} : si le couple substance/code PT n'existe pas : retourne null
 *                            si le couple substance/code PT existe : retourne l'id de ce couple dans la table substance_pt
 */
async function isAlreadyExist_substance_pt_susar_eu (connectionSusarEu,id_substance_pt,susar_eu_id) {
  const SQL_isAlreadyExist = "SELECT sps.substance_pt_id, " +
                                    "sps.susar_eu_id " +
                              "FROM substance_pt_susar_eu sps " + 
                              "WHERE sps.substance_pt_id = ? " +
                                "AND sps.susar_eu_id = ? ;"
  const results = await connectionSusarEu.query(SQL_isAlreadyExist, [
                                                  id_substance_pt,
                                                  susar_eu_id
                                                ] 
  );
  // console.log(results)
  if (results[0].length > 0) {
    // on a déja ce couple dans la table substance_pt_susar_eu
    return results[0]
  } else {
    // on n'a pas encore ce couple dans la table substance_pt_susar_eu
    return null
  }
}


/**
 * Permet de récupérer la liste des médicaments déjà enregistrés dans susar_eu pour un master_id donné.
 * Cette fonction est utilisée dans le cas ou un master_id contient plusieurs médicaments dont la France est rapporteur (plusieurs High Level pour un même SUSAR).
 * 
 * @param {Connection} connectionSusarEu 
 * @param {string} master_id 
 * @returns {Promise<array<medicaments>>} : retourne une promesse contenant un tableau d'objet medicament
 */
async function donne_medicament_by_master_id (connectionSusarEu,master_id) {

  const SQL_medicament = `SELECT * 
  FROM medicaments
  WHERE medicaments.master_id = ?
   AND (medicaments.productcharacterization = 'Suspect' OR medicaments.productcharacterization = 'Interacting' );`
  const results = await connectionSusarEu.query(SQL_medicament, [master_id])
    if (results[0].length > 0) {

      return results[0]
    } else {

      return null
    }
}


/**
 * Permet de récupérer la liste des effets_indesirables déjà enregistrés dans susar_eu pour un master_id donné.
 * Cette fonction est utilisée dans le cas ou un master_id contient plusieurs médicaments dont la France est rapporteur (plusieurs High Level pour un même SUSAR).
 * 
 * @param {Connection} connectionSusarEu 
 * @param {string} master_id 
 * @returns {Promise<array<effets_indesirables>>} : retourne une promesse contenant un tableau d'objet medicament
 */
async function donne_effets_indesirables_by_master_id (connectionSusarEu,master_id) {

  const SQL_effets_indesirables = `SELECT * 
  FROM effets_indesirables
  WHERE effets_indesirables.master_id = ?;`
  const results = await connectionSusarEu.query(SQL_effets_indesirables, [master_id])
    if (results[0].length > 0) {

      return results[0]
    } else {

      return null
    }
}


async function donneObjMed_HL_AssSub_pour_MAJ (tabObjMed,ass_tab_LL) {

  let NotAssSub = false
  let tabObjMedAssSub = []
  let nbMedicTrouve = 0

  for (const medic of tabObjMed) {
    
    tabObjMedAssSub = []

    if (ass_tab_LL.includes(medic.substancename)) {

      const PN_ass = medic.productname
      const tabObjMedFiltrePN = tabObjMed.filter(tabObjMed => tabObjMed.productname === PN_ass)

      if (tabObjMedFiltrePN.length === ass_tab_LL.length) {
        // tabObjMedFiltrePN et ass_tab_LL ont le même nombre d'éléments, c'est un bon début, c'est un premier indice sur le fait qu'on a peut etre a faire a une association de substances
        for (const medicFiltrePN of tabObjMedFiltrePN) {
          if (ass_tab_LL.includes(medicFiltrePN.substancename) === false ) {
            // On a trouvé un substancename qui n'appartient pas a la liste des substances associés, on réinitialise la liste tabObjMedAssSub
            tabObjMedAssSub = []
            NotAssSub = true
            break
          } else {
            // pour le moment, c'est une association de substance, on construit le tableau avec les medic la constituant 
            nbMedicTrouve = nbMedicTrouve + 1
            tabObjMedAssSub.push(medicFiltrePN)
            if (ass_tab_LL.length === nbMedicTrouve) {
              return tabObjMedAssSub
            }
          }
        }
      } else {
        // tabObjMedFiltrePN et ass_tab_LL n'ont pas le même nombre d'éléments, ce n'est donc pas une association de substances
        tabObjMedAssSub = []
        NotAssSub = true
      }
    } else {

    }
  }
  return tabObjMedAssSub
}


export { 
  donne_objIntSubDmm,
  getSusarBNPV_v2,
  donne_lstMasterId,
  getMedicBNPV_v2,
  getEIBNPV_v2,
  getMedHistBNPV_v2,
  getDonneesEtudeBNPV_v2,
  getIndicationBNPV_v2,
  insertDataSUSAR_EU_v2,
// a supprimer apres les tests
  donneObjMed_HL_AssSub_pour_MAJ,
  donne_medicament_by_master_id,
  donne_effets_indesirables_by_master_id,
  isUnique_intervenant_substance_dmm_susar_eu,
  isAlreadyExist_substance_pt,
  isAlreadyExist_substance_pt_susar_eu,
};