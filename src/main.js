
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
    getMedHistBNPV
  } from './db/safetyEasyQueries.js'
  
  import {
    donne_objSubLowLevel,
    effaceTablesSUSAR_EU,
    isSUSAR_EU_unique
  } from './db/susarEuQueries.js'


  import {
    sauvegardeObjet,
    chargementObjet,
    chargeObjBNPV_fromJSON
  } from './JSON_Save.js'


  const RecupDonneesBNPV = async (poolSusarEu,poolSafetyEasy) => {

    const connectionSusarEu = await poolSusarEu.getConnection();

    const donne_lstSubLowLevel = async (objSubLowLevel) => {

      const lstSubLowLevel = objSubLowLevel.map(obj => obj.active_substance_high_le_low_level);

      return lstSubLowLevel;
    }
    const donne_lstMasterId = async (LstSusarBNPV) => {
      return LstSusarBNPV.map(obj => obj.master_id)
    }
    
// -------------------------------------------------------------------------------
// --             début des requetes dans la BNPV           --
// -------------------------------------------------------------------------------
    const objSubLowLevel = await donne_objSubLowLevel(connectionSusarEu)
    // console.log(objSubLowLevel)

    const lstSubLowLevel = await donne_lstSubLowLevel(objSubLowLevel)
    // console.log(lstSubLowLevel)

    const lstSusarBNPV = await getSusarBNPV(poolSafetyEasy, lstSubLowLevel)
    // console.log(lstSusarBNPV[0])

    const lstMasterId = await donne_lstMasterId (lstSusarBNPV)
    // console.log(lstMasterId)

    const MedicBNPV = await getMedicBNPV(poolSafetyEasy, lstMasterId);
    // console.log(Medic);

    const EIBNPV = await getEIBNPV(poolSafetyEasy, lstMasterId);
    // console.log(EI);

    const MedHistBNPV = await getMedHistBNPV(poolSafetyEasy, lstMasterId);
    // console.log(MedHist);

    connectionSusarEu.release();
// -------------------------------------------------------------------------------
// --             fin des requetes dans la BNPV           --
// -------------------------------------------------------------------------------

// sauvegarde des objets dans des fichiers JSON, pour éviter les multiples requêtes dans la BNPV durant les DEV
    await sauvegardeObjet(objSubLowLevel,"objSubLowLevel")
    await sauvegardeObjet(lstSusarBNPV,"lstSusarBNPV")
    await sauvegardeObjet(MedicBNPV,"MedicBNPV")
    await sauvegardeObjet(EIBNPV,"EIBNPV")
    await sauvegardeObjet(MedHistBNPV,"MedHistBNPV")

    return [
      objSubLowLevel,
      lstSusarBNPV,
      MedicBNPV,
      EIBNPV,
      MedHistBNPV
    ]
  };
  


  const insertSUSAR_EU = async (poolSusarEu,objSubLowLevel,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV) => {
    async function insertDataSUSAR_EU(connectionSusarEu,objSubLowLevel,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV) {
      try {

        // début de la transaction
        await connectionSusarEu.beginTransaction();

        /*************************************************************************************** */        
        
        // boucle pour les INSERT dans les différentes tables 
        let i = 0
        for (const susar of lstSusarBNPV) {
          i++
          
          console.log(susar['master_id'])

          // vérification avec les INSERT d'un SUSAR et des ses enregistrements liés :
          //      - On regarde que "susar['master_id']" n'existe pas déjà dans la table "susar_eu"
          //      - On regarde que "susar['specificcaseid'] AND susar['DLPVersion']" n'existe pas déjà dans la table "susar_eu"
          const isUnique = await isSUSAR_EU_unique (connectionSusarEu,susar['master_id'],susar['specificcaseid'],susar['DLPVersion'])

          if (isUnique) {
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
              susar['narrativeincludeclinical']
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



          // pour tester, sort après 5 susars
          if (i>5) {
            break
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
    

    const connectionSusarEu = await poolSusarEu.getConnection();
    await effaceTablesSUSAR_EU (connectionSusarEu)
    await insertDataSUSAR_EU(connectionSusarEu,objSubLowLevel,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV)
    await connectionSusarEu.release();

  }


  const poolSusarEu = await createPoolSusarEu();
  const poolSafetyEasy = await createPoolSafetyEasy();

  // const [objSubLowLevel,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV] = await RecupDonneesBNPV(poolSusarEu,poolSafetyEasy)
  // await closePoolSafetyEasy(poolSafetyEasy)
  
  const [objSubLowLevel,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV] = await chargeObjBNPV_fromJSON()
  
  await insertSUSAR_EU(poolSusarEu,objSubLowLevel,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV);

  // const effTbSUSAR_EU = await effaceTablesSUSAR_EU(connectionSusarEu)
  // const insTbSUSAR_EU = await insertDataSUSAR_EU(connectionSusarEu)

  await closePoolSusarEu(poolSusarEu)



  