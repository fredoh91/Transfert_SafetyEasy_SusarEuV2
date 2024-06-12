

import {
    logStream , 
    logger
  } from './logs_config.js'

/**
 * 
 * @param {string} SeriousnessCriteria_brut : chaine contenant les criteres de gravité séparés par deux tildes ~~
 * 
 * 
 * on l'utilise avec const lstSeriousnessCriteria = await donne_lstSeriousnessCriteria (susar['seriousnesscriteria'])
 * renvoi TRUE si la valeur d'entrée contient "Life Threatening" ou "Death"
 */
async function isDeathLifethreatening(SeriousnessCriteria_brut) {

    if (SeriousnessCriteria_brut.includes("Life Threatening") || SeriousnessCriteria_brut.includes("Death")) {
        return true
    } else {
        return false
    }

}

/**
 * 
 * @param {*} connectionSusarEu 
 * @param {*} pays_survenue 
 * @returns true si le pays_survenue est eureopéen, false dans cas contraire
 */
async function isCasEurope (connectionSusarEu,pays_survenue) {

    const SQL = `SELECT COUNT(*) AS NbLignes 
                            FROM pays_europe
                        WHERE pays_europe.inactif = FALSE
                            AND pays_europe.code_pays = ?`
    const results = await connectionSusarEu.query(SQL, [pays_survenue])
    if (results[0].length > 0) {
        if(results[0][0]['NbLignes']>0) {
            return true
        } else {
            return false
        }
        // return results[0]
    } else {
        return false
    }
}

/**
 * Cette fonction retourne une liste de libelles LLT séparé par des virgules, qui sera directement utilisable dans le WHERE ... IN d'une requête SQL
 * @param {*} EIFiltre 
 * @returns 
 */
async function donneLst_SQL_IN (EIFiltre) {

    // Remplacement les guillemets droits par des guillemets simples
    const lstLibLLT = EIFiltre.map(EI => {
        let EI_modif = EI.reactionmeddrallt;
        EI_modif = EI_modif.replace(/’/g, "'");
        return EI_modif;
    });
    // Extraire les éléments et les mettre entre guillemets doubles
    const lstLibLLTFormatted = lstLibLLT.map(item => `"${item}"`);
    // Mise entre parenthèses et séparation par des virgules
    const lstLibLLTString = `(${lstLibLLTFormatted.join(",")})`;

    return lstLibLLTString
}
/**
 * 
 * @param {*} connectionSusarEu 
 * @param {*} EIFiltre : Liste des Effets Indésirables pour un cas donné
 * @returns 
 */
async function isDME (connectionSusarEu,EIFiltre) {
    
    const lstLibLLT = await donneLst_SQL_IN(EIFiltre)

    const SQL = `SELECT COUNT(*) AS NbLignes FROM dme
    WHERE dme.inactif = FALSE
    AND dme.llt_name_fr IN ${lstLibLLT}`

    // logger.debug(SQL)
    // logger.debug(lstLibLLT)

    const results = await connectionSusarEu.query(SQL)
    if (results[0].length > 0) {
            if(results[0][0]['NbLignes']>0) {
                    return true
                } else {
            return false
        }
        // return results[0]
    } else {
        return false
    }
}

/**
 * 
 * @param {*} connectionSusarEu 
 * @param {*} EIFiltre : Liste des Effets Indésirables pour un cas donné
 * @returns 
 */
async function isIME (connectionSusarEu,EIFiltre) {
    
    const lstLibLLT = await donneLst_SQL_IN(EIFiltre)

    const SQL = `SELECT COUNT(*) AS NbLignes FROM ime
    WHERE ime.inactif = FALSE
    AND ime.llt_name_fr IN ${lstLibLLT}`

    const results = await connectionSusarEu.query(SQL)
    if (results[0].length > 0) {
            if(results[0][0]['NbLignes']>0) {
                    return true
                } else {
            return false
        }
        // return results[0]
    } else {
        return false
    }
}


async function isPositiveRechallenge (connectionSafetyEasy,master_id) {
    
    const SQL = `SELECT COUNT(mv.id) AS NbLignes 
                  FROM master_versions mv 
            INNER JOIN bi_identifiers id ON mv.id = id.master_id 
            INNER JOIN bi_caseinfo ci ON mv.id = ci.master_id 
            INNER JOIN bi_primarysource ps ON mv.id = ps.master_id 
            INNER JOIN bi_product pr ON mv.id = pr.master_id 
             LEFT JOIN bi_relatedness rl ON mv.id = rl.master_id AND pr.seq_product = rl.seq_product_asses 
                 WHERE 1 = 1 
                   AND mv.id = '${master_id}' 
                   AND mv.specificcaseid LIKE 'EC%' 
                   AND ci.casenullification <> 'Nullification' 
                   AND ps.primarysourceforregulatorypurposes LIKE 'Yes' 
                   AND rl.productrecurreadministration = 'Rechallenge, reaction recurred' 
                   AND mv.Deleted = 0 ;`

    const results = await connectionSafetyEasy.query(SQL)
    // console.log(results[0])
    // console.log(results[0][0]['NbLignes'])
    // process.exit(0)
    if (results[0].length > 0) {
            if(results[0][0]['NbLignes']>0) {
                    return true
                } else {
            return false
        }
    } else {
        return false
    }
}

async function isParentChild (connectionSafetyEasy,master_id) {
    
    const SQL = `SELECT COUNT(mv.id) AS NbLignes 
                    FROM master_versions mv 
              INNER JOIN bi_identifiers id ON mv.id = id.master_id 
              INNER JOIN bi_caseinfo ci ON mv.id = ci.master_id 
              INNER JOIN bi_primarysource ps ON mv.id = ps.master_id 
               LEFT JOIN bi_parentinfo pinf ON mv.id = pinf.master_id 
               LEFT JOIN bi_parentmedhistory pmed ON mv.id = pmed.master_id 
               LEFT JOIN bi_pastdrughistory pdh ON mv.id = pdh.master_id 
               LEFT JOIN bi_parentdrug_activesubstance pas ON mv.id = pas.master_id 
                   WHERE 1 = 1 
                     AND mv.id = '${master_id}' 
                     AND specificcaseid LIKE 'EC%' 
                     AND ci.casenullification <> 'Nullification' 
                     AND ps.primarysourceforregulatorypurposes LIKE 'Yes' 
                     AND pinf.id IS NOT NULL ;`

    const results = await connectionSafetyEasy.query(SQL)
    // console.log(results[0])
    // console.log(results[0][0]['NbLignes'])
    // process.exit(0)
    if (results[0].length > 0) {
            if(results[0][0]['NbLignes']>0) {
                    return true
                } else {
            return false
        }
    } else {
        return false
    }
}

async function donneGroupeAge(patient_age_group, patient_age, patient_age_unit_label) {
    
    
    // console.log(patient_age_group, " ", patient_age, " ", patient_age_unit_label)
    // console.log("patient_age : ", patient_age)


    if (patient_age_group !== "") {

        switch (patient_age_group) {
            case 'Foetus':
                return 'Paediatric'
                break;
            case 'Infant':
                return 'Paediatric'
                break;
            case 'Neonate':
                return 'Paediatric'
                break;
            case 'Child':
                return 'Paediatric'
                break;
            case 'Adolescent':
                return 'Paediatric'
                break;
            case 'Adult':
                return 'Adult'
                break;
            case 'Elderly':
                return 'Geriatric'
                break;
            default:
                logger.debug('je ne trouve pas ce groupe d\'age : ' + patient_age_group)
        }

    } else {

        if (patient_age !== null && patient_age_unit_label !== null) {
            // on a un age et une unité d'age
            switch (patient_age_unit_label) {
                case 'Hour':
                    return 'Paediatric'
                    break;
                case 'Day':
                    if (patient_age <= 6570) {
                        return 'Paediatric'
                    } else if (patient_age > 6570 && patient_age <= 23725) {
                        return 'Adult'
                    } else if (patient_age > 23725) {
                        return 'Geriatric'
                    }
                    // return 'Paediatric'
                    break;
                case 'Week':
                    if (patient_age <= 936) {
                        return 'Paediatric'
                    } else if (patient_age > 936 && patient_age <= 3380) {
                        return 'Adult'
                    } else if (patient_age > 3380) {
                        return 'Geriatric'
                    }
                    break;
                case 'Month':
                    if (patient_age <= 216) {
                        return 'Paediatric'
                    } else if (patient_age > 216 && patient_age <= 780) {
                        return 'Adult'
                    } else if (patient_age > 780) {
                        return 'Geriatric'
                    }
                    break;
                case 'Decade':
                    if (patient_age <= 1) {
                        return 'Paediatric'
                    } else if (patient_age > 1 && patient_age <= 6) {
                        return 'Adult'
                    } else if (patient_age > 6) {
                        return 'Geriatric'
                    }
                    break;
                case 'Year':
                    if (patient_age <= 18) {
                        return 'Paediatric'
                    } else if (patient_age > 18 && patient_age <= 65) {
                        return 'Adult'
                    } else if (patient_age > 65) {
                        return 'Geriatric'
                    }
                    break;
                default:
                    logger.debug('l\'unité d\'age suivante est inconnue : ' + patient_age_unit_label)
            }            
        } else {
            return null
        }
        
    }
}

async function isPaediatricGeriatric(patient_age_group, patient_age, patient_age_unit_label) {

    const groupAge = await donneGroupeAge (patient_age_group, patient_age, patient_age_unit_label) 

    if (groupAge === 'Paediatric' || groupAge === 'Geriatric' ) {
        return true
    } else {
        return false
    }

}

async function donneNiveauPriorisation (connectionSusarEu,connectionSafetyEasy,SusarBNPV,EIBNPV) {

    const resIsDeathLifethreatening = isDeathLifethreatening(SusarBNPV['seriousnesscriteria'])
    const resIsCasEurope = isCasEurope(connectionSusarEu,SusarBNPV['pays_survenue'])
    
    const EIFiltre = EIBNPV.filter(EI => EI.master_id === SusarBNPV['master_id']);
    // console.log(EIFiltre)
    const resIsDME = isDME(connectionSusarEu,EIFiltre)
    // console.log(await resIsDME)
    const resIsIME = isIME(connectionSusarEu,EIFiltre)
    // const resIsPositiveRechallenge = isPositiveRechallenge(connectionSafetyEasy,'25441839')
    const resIsPositiveRechallenge = isPositiveRechallenge(connectionSafetyEasy,SusarBNPV['master_id'])
    // const resIsParentChild = isParentChild(connectionSafetyEasy,'36049087')
    const resIsParentChild = isParentChild(connectionSafetyEasy,SusarBNPV['master_id'])

    const resIsPaediatricGeriatric = await isPaediatricGeriatric (SusarBNPV['patientagegroup'],SusarBNPV['patientonsetage'],SusarBNPV['patientonsetageunitlabel'])

    try {
        const results  = await Promise.all([
            resIsDeathLifethreatening, 
            resIsCasEurope,
            resIsDME,
            resIsIME,
            resIsPositiveRechallenge,
            resIsParentChild,
            resIsPaediatricGeriatric
        ]);

        // critères 2a
        if ( 
                results[0]          //  Death = true ou Lifethreatening = true
                && results[1]       //  CasEurope = true
            ) {
                return "Niveau 2a"
        }
    
        
        // critères 2b
        if ( 
                results[1]          //  CasEurope = true
            ) {
                if (
                    results[4]          //  Positive Rechallenge = true
                    || results[5]       //  Parent/Child = true
                    || results[2]       //  Cas DME = true
                    || results[6]       //  Cas Paediatric = true ou Geriatric = true
                    
                ) {
                    return "Niveau 2b"
                }
            } else {                //  CasEurope = false
                if ( 
                    results[0]      //  Death = true ou Lifethreatening = true
                ) {
                    return "Niveau 2b"
                }
        }

        // critères 2c
        if ( 
            results[1]          //  CasEurope = true
        ) {
            if (
                results[3]       //  Cas IME = true
            ) {
                return "Niveau 2c"
            }
        } else {                //  CasEurope = false
            if ( 
                results[4]          //  Positive Rechallenge = true
                || results[5]       //  Parent/Child = true
                || results[3]       //  Cas IME = true
                || results[6]       //  Cas Paediatric = true ou Geriatric = true
            ) {
                return "Niveau 2c"
            }
    }

        return "Niveau 1"

    } catch (error) {
      // Gérer les erreurs
        // console.log(error)
        logger.debug('!! ERROR !! ' + 
        SusarBNPV['master_id'] );
        logger.debug(error)
        
        return "!! ERROR !!"
    }
}

export { 
    isDeathLifethreatening,
    isCasEurope,
    isDME,
    isIME,
    isPositiveRechallenge,
    isParentChild,
    donneNiveauPriorisation,
    donneLst_SQL_IN,
    isPaediatricGeriatric,
    donneGroupeAge,
};
