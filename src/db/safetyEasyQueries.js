import {
    sauvegardeObjet,
    chargementObjet,
    chargeObjBNPV_fromJSON
  } from '../JSON_Save.js'


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
 * 
 */




  /**
   * 
   * @param {Pool} poolSafetyEasy 
   * @param {Array<[active_substance_grouping[]]} objSubLowLevel 
   * @param {Array<string>} lstSubLowLevel : tableau des low-level substance name suivis par la France
   * @returns {Promise
   *            <Array
   *                <Array<susar_eu>>
   *                <Array<medicaments>>
   *                <Array<effets_indesirables>>
   *                <Array<medical_history>>
   *                <Array<donnees_etude>>
   * >}
   */
  const RecupDonneesBNPV = async (poolSafetyEasy,objSubLowLevel,lstSubLowLevel,datePivot = new Date()) => {

// // ------------------------------------------------------------------------------------------------------
// // --      début de la requete dans SUSAR_EU pour récupérer la liste des low-level substance name      --
// // ------------------------------------------------------------------------------------------------------
//     const connectionSusarEu = await poolSusarEu.getConnection();

//     const [objSubLowLevel,lstSubLowLevel] = await donne_lstSubLowLevel(connectionSusarEu)
//     // console.log(objSubLowLevel)
//     // console.log(lstSubLowLevel)
    
//     connectionSusarEu.release();
// // ---------------------------------------------------------------------------------------------------
// // --      fin des requetes dans SUSAR_EU pour récupérer la liste des low-level substance name      --
// // ---------------------------------------------------------------------------------------------------
    /**
     * 
     * @param {Array<susar_eu>} LstSusarBNPV 
     * @returns {Promise<Array<number>>}
     */
    const donne_lstMasterId = async (LstSusarBNPV) => {
      return LstSusarBNPV.map(obj => obj.master_id)
    }
    
// -------------------------------------------------------------------------------
// --             début des requetes dans la BNPV           --
// -------------------------------------------------------------------------------

// const lstSusarBNPV = await getSusarBNPV(poolSafetyEasy, lstSubLowLevel, new Date(),5,1)
    const lstSusarBNPV = await getSusarBNPV(poolSafetyEasy, lstSubLowLevel, datePivot, 3 ,1)
    // console.log(lstSusarBNPV[0])

    const lstMasterId = await donne_lstMasterId (lstSusarBNPV)
    // console.log(lstMasterId)

    const MedicBNPV = await getMedicBNPV(poolSafetyEasy, lstMasterId);
    // console.log(MedicBNPV[0]);

    const EIBNPV = await getEIBNPV(poolSafetyEasy, lstMasterId);
    // console.log(EIBNPV[0]);

    const MedHistBNPV = await getMedHistBNPV(poolSafetyEasy, lstMasterId);
    // console.log(MedHistBNPV[0]);

    const DonneesEtudeBNPV = await getDonneesEtudeBNPV(poolSafetyEasy, lstMasterId);
    // console.log(DonneesEtudeBNPV[0]);

// -------------------------------------------------------------------------------
// --             fin des requetes dans la BNPV           --
// -------------------------------------------------------------------------------

// sauvegarde des objets dans des fichiers JSON, pour éviter les multiples requêtes dans la BNPV durant les DEV
    await sauvegardeObjet(objSubLowLevel,"objSubLowLevel")
    await sauvegardeObjet(lstSusarBNPV,"lstSusarBNPV")
    await sauvegardeObjet(MedicBNPV,"MedicBNPV")
    await sauvegardeObjet(EIBNPV,"EIBNPV")
    await sauvegardeObjet(MedHistBNPV,"MedHistBNPV")
    await sauvegardeObjet(DonneesEtudeBNPV,"DonneesEtudeBNPV")

    return [
      lstSusarBNPV,
      MedicBNPV,
      EIBNPV,
      MedHistBNPV,
      DonneesEtudeBNPV
    ]
  };



/**
 * getSusarBNPV : récupération des SUSARs dans la BNPV
 * 
 * @param {Pool} poolSafetyEasy 
 * @param {Array.<string>} lstSubLowLevel : tableau des low-level substance name suivis par la France
 * @param {Date} datePivotStatus : date pivot pour calculer le "statusDate between ...
 * @param {number} NbJourAvant : nombre de jour à retrancher à la date pivot pour calculer le "statusDate between ...
 * @param {number} NbJourApres : nombre de jour à ajouter à la date pivot pour calculer le "statusDate between ... 
 * @returns {Promise<Array<susar_eu>>} : une promesse de tableau d'objet avec la liste des susars
 */
async function getSusarBNPV(poolSafetyEasy, lstSubLowLevel, datePivotStatus, NbJourAvant, NbJourApres) {
    const connectionSafetyEasy = await poolSafetyEasy.getConnection();
    // permet de remplacer les "simples quote" en "antislash + simple quote" ce qui permet d'échapper les simple quote dans le SQL 
    const lstSubLowLevelEscaped = lstSubLowLevel.map(name => name.replace(/'/g, "\\'"));
    // Ajoute des simple quote de part et d'autre de chaque élément du tableau pour générer un WHERE ... IN (...)
    const substanceNames = lstSubLowLevelEscaped.map(name => "'" + name + "'").join(',');
    // permet de rechercher les EC dont le status date est compris entre 3 jours avant et 3 jours après la date du jour



    // formatage des date pour la requête
    const jourAvant = new Date(datePivotStatus - NbJourAvant * 24 * 60 * 60 * 1000);
    const jourApres = new Date(datePivotStatus + NbJourApres * 24 * 60 * 60 * 1000);
    const startDate = jourAvant.toISOString().slice(0, 10) + " 00:00:00"
    const endDate = jourApres.toISOString().slice(0, 10) + " 23:59:59"
    // console.log (substanceNames)
    // const today = new Date();
    // const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
    // const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    // const startDate = threeDaysAgo.toISOString().slice(0, 19).replace('T', ' ');
    // const endDate = threeDaysFromNow.toISOString().slice(0, 19).replace('T', ' ');
  
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
                    "AND mv.id IN (SELECT DISTINCT mv.id as id_prod " +
                                            " FROM master_versions mv " +
                                            " INNER JOIN bi_product pr ON mv.id = pr.master_id " +
                                            " LEFT JOIN bi_product_substance su ON pr.master_id = su.master_id AND pr.NBBlock = su.NBBlock " +
                                            " WHERE 1 = 1 " +
                                            " AND specificcaseid LIKE 'EC%' AND su.substancename IN  (" + substanceNames + ") " +
                                            " AND (pr.productcharacterization = 'Suspect' OR pr.productcharacterization = 'Interacting') " +
                                            " AND mv.Deleted = 0) " + 
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
 * @param {Pool} poolSafetyEasy 
 * @param {Array<number>} lstMasterId : tableau des masterId recherchés
 * @returns {Promise<Array<medicaments>>} : un tableau d'objet medicaments 
 */
async function getMedicBNPV(poolSafetyEasy, lstMasterId ) {
    const connectionSafetyEasy = await poolSafetyEasy.getConnection();

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
                    "AND mv.id IN ( " + lstMasterId + ") " + 
                    "AND mv.Deleted = 0; "
    
    const [Medic, champs] = await connectionSafetyEasy.query(SQL);
    connectionSafetyEasy.release();

    return Medic ;
}

/**
 * getDonneesEtudeBNPV : récupération des données de l'essai clinique dans la BNPV
 * 
 * @param {Pool} poolSafetyEasy 
 * @param {Array<number>} lstMasterId : tableau des masterId recherchés
 * @returns {Promise<Array<donnees_etude>>} : un tableau d'objet donnees_etude 
 */
async function getDonneesEtudeBNPV(poolSafetyEasy, lstMasterId ) {
    const connectionSafetyEasy = await poolSafetyEasy.getConnection();

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
    connectionSafetyEasy.release();

    return DonneesEtude ;
}


/**
 * getEIBNPV : récupération des effets indésireables des SUSARs dans la BNPV
 * 
 * @param {Pool} poolSafetyEasy 
 * @param {Array<number>} lstMasterId : tableau des masterId recherchés
 * @returns {Promise<Array<effets_indesirables>>} : un tableau d'objet effets_indesirables 
 */
async function getEIBNPV(poolSafetyEasy, lstMasterId ) {
    const connectionSafetyEasy = await poolSafetyEasy.getConnection();

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
    connectionSafetyEasy.release();

    return  EI ;
}


/**
 * getMedHistBNPV : récupération des "medical history" des SUSARs dans la BNPV
 * 
 * @param {Pool} poolSafetyEasy 
 * @param {Array<number>} lstMasterId : tableau des masterId recherchés
 * @returns {Promise<Array<medical_history>>} : un tableau d'objet medical_history 
 */
async function getMedHistBNPV(poolSafetyEasy, lstMasterId ) {
    const connectionSafetyEasy = await poolSafetyEasy.getConnection();

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
    connectionSafetyEasy.release();

    return  MedHist ;
}



export { 
    getSusarBNPV,
    getMedicBNPV,
    getEIBNPV,
    getMedHistBNPV,
    getDonneesEtudeBNPV,
    RecupDonneesBNPV
};