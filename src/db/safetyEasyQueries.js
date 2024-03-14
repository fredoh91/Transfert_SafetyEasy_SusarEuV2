

// -------------------------------------------------------------------------------
// --             getSusarBNPV : récupération des SUSARs dans la BNPV           --
// -------------------------------------------------------------------------------
/**
 * 
 * @param {*} poolSafetyEasy 
 * @param {*} lstSubLowLevel : tableau des low level substance name suivis par la France
 * @returns : un objet avec la liste des susar
 */
async function getSusarBNPV(poolSafetyEasy, lstSubLowLevel) {
    const connectionSafetyEasy = await poolSafetyEasy.getConnection();
    // permet de remplacer les "simples quote" en "antislash + simple quote" ce qui permet d'échapper les simple quote dans le SQL 
    const lstSubLowLevelEscaped = lstSubLowLevel.map(name => name.replace(/'/g, "\\'"));
    // Ajoute des simple quote de part et d'autre de chaque élément du tableau pour générer un WHERE ... IN (...)
    const substanceNames = lstSubLowLevelEscaped.map(name => "'" + name + "'").join(',');
    // permet de rechercher les EC dont le status date est compris entre 3 jours avant et 3 jours après la date du jour


    // console.log (substanceNames)
    const today = new Date();
    const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    const startDate = threeDaysAgo.toISOString().slice(0, 19).replace('T', ' ');
    const endDate = threeDaysFromNow.toISOString().slice(0, 19).replace('T', ' ');
  
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
                                            " AND mv.Deleted = 0) " + 
                    "ORDER BY mv.id;"

// console.log(SQL)


    const [LstSusarBNPV, champs] = await connectionSafetyEasy.query(SQL);
    // console.log(LstSusarBNPV[0])
    connectionSafetyEasy.release();
    return  LstSusarBNPV ;
}


// -------------------------------------------------------------------------------
// --    getMedicBNPV : récupération des médicaments des SUSARs dans la BNPV    --
// -------------------------------------------------------------------------------
/**
 * 
 * @param {*} poolSafetyEasy 
 * @param {*} lstMasterId : tableau des masterId recherchés
 * @returns 
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

    return  Medic ;
}


// ----------------------------------------------------------------------------------
// --  getEIBNPV : récupération des effets indésireables des SUSARs dans la BNPV   --
// ----------------------------------------------------------------------------------
/**
 * 
 * @param {*} poolSafetyEasy 
 * @param {*} lstMasterId : tableau des masterId recherchés
 * @returns 
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
    "re.reactionmeddrasoc, " +
    "re.soc " +
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



// ------------------------------------------------------------------------------------
// --  getMedHistBNPV : récupération des "medical history" des SUSARs dans la BNPV   --
// ------------------------------------------------------------------------------------
/**
 * 
 * @param {*} poolSafetyEasy 
 * @param {*} lstMasterId : tableau des masterId recherchés
 * @returns 
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
    getMedHistBNPV
};