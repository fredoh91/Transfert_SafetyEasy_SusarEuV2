// const { connection } = require('./db');



async function getSusarBNPV(poolSafetyEasy, connectionSusarEu, lstSubLowLevel) {
    const connectionSafetyEasy = await poolSafetyEasy.getConnection();
    const lstSubLowLevelEscaped = lstSubLowLevel.map(name => name.replace(/'/g, "\\'"));
    const substanceNames = lstSubLowLevelEscaped.map(name => "'" + name + "'").join(',');
    const today = new Date();
    const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
  
    const startDate = threeDaysAgo.toISOString().slice(0, 19).replace('T', ' ');
    const endDate = threeDaysFromNow.toISOString().slice(0, 19).replace('T', ' ');
  
    const SQL = "SELECT DISTINCT " +
                    "mv.id, mv.caseid, mv.specificcaseid, mv.DLPVersion, mv.creationdate, mv.statusdate, " +
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
    const [LstSusarBNPV] = await connectionSafetyEasy.query(SQL);  
    connectionSafetyEasy.release();
    return { poolSafetyEasy, connectionSusarEu, lstSubLowLevel, LstSusarBNPV };
}

async function getMedicBNPV(poolSafetyEasy, connectionSusarEu, LstSusarBNPV, lstMasterId ) {
    const connectionSafetyEasy = await poolSafetyEasy.getConnection();

    const SQL = "SELECT DISTINCT " + 
    "mv.id, " + 
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

    // console.log (SQL)

    // const SQL = "SELECT DISTINCT " +
    //                 "mv.id, mv.caseid, mv.specificcaseid, mv.DLPVersion, mv.creationdate, mv.statusdate, " +
    //                 "id.worldwideuniquecaseidentificationnumber, " +
    //                 "ci.iscaseserious, ci.seriousnesscriteria, ci.receivedate, " +
    //                 "mo.receiptdate, " +
    //                 "pa.patientsex, pa.patientonsetage, pa.patientonsetageunitlabel, pa.patientagegroup, " +
    //                 "ps.reportercountry pays_survenue, " +
    //                 "na.narrativeincludeclinical, " +
    //                 "cs.casesummarylanguage, cs.casesummary " +
    //                 "FROM master_versions mv " +
    //                 "LEFT JOIN bi_study st ON mv.id = st.master_id " +
    //                 "LEFT JOIN bi_study_registration sr ON mv.id = sr.master_id " +
    //                 "INNER JOIN bi_identifiers id ON mv.id = id.master_id " +
    //                 "INNER JOIN bi_caseinfo ci ON mv.id = ci.master_id " +
    //                 "INNER JOIN (SELECT master_id, MAX(receiptdate) AS receiptdate FROM bi_mostrecentinformation GROUP BY master_id) AS mo ON mv.id = mo.master_id " +
    //                 "INNER JOIN bi_patientinformations pa ON mv.id = pa.master_id " +
    //                 "INNER JOIN bi_primarysource ps ON mv.id = ps.master_id " +
    //                 "LEFT JOIN bi_narrative na ON mv.id = na.master_id " +
    //                 "LEFT JOIN bi_case_summary cs ON mv.id = cs.master_id " +
    //                 "WHERE 1 = 1 " +
    //                 "AND specificcaseid LIKE 'EC%' " +
    //                 "AND mv.StatusDate BETWEEN '" + startDate + "' AND '" + endDate + "' " +
    //                 "AND ci.casenullification <> 'Nullification' " +
    //                 "AND ps.primarysourceforregulatorypurposes LIKE 'Yes' " +
    //                 "AND mv.id IN (SELECT DISTINCT mv.id as id_prod " +
    //                                         " FROM master_versions mv " +
    //                                         " INNER JOIN bi_product pr ON mv.id = pr.master_id " +
    //                                         " LEFT JOIN bi_product_substance su ON pr.master_id = su.master_id AND pr.NBBlock = su.NBBlock " +
    //                                         " WHERE 1 = 1 " +
    //                                         " AND specificcaseid LIKE 'EC%' AND su.substancename IN  (" + substanceNames + ") " +
    //                                         " AND mv.Deleted = 0) " + 
    //                 "ORDER BY mv.id;"
    const [Medic] = await connectionSafetyEasy.query(SQL);  
    connectionSafetyEasy.release();

    // console.log(connectionSusarEu)

    return { connectionSusarEu, LstSusarBNPV, lstMasterId, Medic };
}



export { 
    getSusarBNPV,
    getMedicBNPV 
};