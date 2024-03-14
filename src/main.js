
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
    donne_objSubLowLevel
  } from './db/susarEuQueries.js'


  import {
    sauvegardeObjet,
    chargementObjet
  } from './JSON_Save.js'


  const RecupDonneesBNPV = async () => {


    const poolSusarEu = await createPoolSusarEu();
    const poolSafetyEasy = await createPoolSafetyEasy();
    const connectionSusarEu = await poolSusarEu.getConnection();


    const donne_lstSubLowLevel = async (objSubLowLevel) => {
      // console.log(results[0][0])
      // console.log(results[0])
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

    const Medic = await getMedicBNPV(poolSafetyEasy, lstMasterId);
    // console.log(Medic);

    const EI = await getEIBNPV(poolSafetyEasy, lstMasterId);
    // console.log(EI);

    const MedHist = await getMedHistBNPV(poolSafetyEasy, lstMasterId);
    // console.log(MedHist);

    await closePoolSafetyEasy(poolSafetyEasy)
// -------------------------------------------------------------------------------
// --             fin des requetes dans la BNPV           --
// -------------------------------------------------------------------------------

// sauvegarde des objets dans des fichiers JSON
    await sauvegardeObjet(objSubLowLevel,"objSubLowLevel")
    await sauvegardeObjet(lstSusarBNPV,"lstSusarBNPV")
    await sauvegardeObjet(Medic,"Medic")
    await sauvegardeObjet(EI,"EI")
    await sauvegardeObjet(MedHist,"MedHist")


    
    
    await closePoolSusarEu(poolSusarEu)
    
  };
  
  const chargeObjBNPV = async () => {
    
    const objSubLowLevel = await chargementObjet("objSubLowLevel")
    const lstSusarBNPV = await chargementObjet("lstSusarBNPV")
    const MedicBNPV = await chargementObjet("Medic")
    const EIBNPV = await chargementObjet("EI")
    const MedHistBNPV = await chargementObjet("MedHist")
    // console.log(MedHist.length);
    // // console.log(MedHist[0]);
    // const MedHistFilt =  MedHist.filter(objet => objet.master_id === 31713704);
    // console.log(MedHistFilt.length);
    
    
    let i = 0
    for (const susar of lstSusarBNPV) {
      i++

      console.log(susar['master_id'])

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

        // console.log(objSubhighLevelFiltre[0])
        console.log(Medic['NBBlock'] + " : " + 
                    Medic['NBBlock2'] + " - " +
                    Medic['productname'] + " / " + 
                    Medic['substancename'] + " (" +
                    Medic['productcharacterization'] + ") - " + 
                    highLevelSubName
                    )
      }


      // pour charger les effets indesirables

      console.log ("Effets indesirables : ")
      const EIFiltre = EIBNPV.filter(EI => EI.master_id === susar['master_id']);
      for (const EI of EIFiltre) {
        console.log(EI['codereactionmeddrapt'] + " : " + 
                    EI['reactionmeddrapt']  + " (" + 
                    EI['reactionstartdate'] + ")" 
                    )
      }


      // pour charger les effets indesirables

      console.log ("Medical history : ")
      const MedHistFiltre = MedHistBNPV.filter(MedHist => MedHist.master_id === susar['master_id']);
      for (const MedHist of MedHistFiltre) {


        if (MedHist['patientmedicalcomment']==='') {
          console.log(MedHist['code_PT'] + " : " + 
                      MedHist['lib_PT']
                      )
        } else {
          console.log(MedHist['code_PT'] + " : " + 
                      MedHist['lib_PT'] + " (" +
                      MedHist['patientmedicalcomment'] + ")"
                      )
        }

      }


      // pour tester, sort après 5 susars
      if (i>5) {
        break
      }
    }
  }


  const insertSUSAR_EU = async () => {

    const effaceTablesSUSAR_EU = async (connectionSusarEu) => {
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
        await closePoolSusarEu(poolSusarEu)
      }
    }

    const poolSusarEu = await createPoolSusarEu();
    const connectionSusarEu = await poolSusarEu.getConnection();
    const effTbSUSAR_EU = await effaceTablesSUSAR_EU(connectionSusarEu)
    // console.log(connectionSusarEu)

    // await closePoolSusarEu(poolSusarEu)
  }

  // RecupDonneesBNPV();
  // chargeObjBNPV();
  insertSUSAR_EU();

  