
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
    RecupDonneesBNPV
  } from './db/safetyEasyQueries.js'
  
  import {
    donne_objSubLowLevel,
    effaceTablesSUSAR_EU,
    isSUSAR_EU_unique,
    insertDataSUSAR_EU,
    donne_lstSubLowLevel
  } from './db/susarEuQueries.js'


  import {
    sauvegardeObjet,
    chargementObjet,
    chargeObjBNPV_fromJSON
  } from './JSON_Save.js'


  import {
    logStream , 
    logger
  } from './logs_config.js'
  

  const insertSUSAR_EU = async (poolSusarEu,objSubLowLevel,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV,DonneesEtudeBNPV) => {
    const connectionSusarEu = await poolSusarEu.getConnection();
    await insertDataSUSAR_EU(connectionSusarEu,objSubLowLevel,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV,DonneesEtudeBNPV)
    await connectionSusarEu.release();
  }

  const main = async () => {

    logger.info('Début import sur une plage de dates : Safety Easy => SUSAR_EU_v2');
    
    // traitement principal
    
    const poolSusarEu = await createPoolSusarEu();
    const poolSafetyEasy = await createPoolSafetyEasy();
    
    let objSubLowLevel
    let lstSubLowLevel
    let lstSusarBNPV
    let MedicBNPV
    let EIBNPV
    let MedHistBNPV
    let DonneesEtudeBNPV
    
    // ------------------------------------------------------------------------------------------------------
    // --      début de la requete dans SUSAR_EU pour récupérer la liste des low-level substance name      --
    // ------------------------------------------------------------------------------------------------------
    const connectionSusarEu = await poolSusarEu.getConnection();
    
    // const [objSubLowLevel,lstSubLowLevel] = await donne_lstSubLowLevel(connectionSusarEu)
    [objSubLowLevel,lstSubLowLevel] = await donne_lstSubLowLevel(connectionSusarEu)
    // console.log(objSubLowLevel)
    // console.log(lstSubLowLevel)
    await effaceTablesSUSAR_EU (connectionSusarEu)
    
    connectionSusarEu.release();
    // ---------------------------------------------------------------------------------------------------
    // --      fin des requetes dans SUSAR_EU pour récupérer la liste des low-level substance name      --
    // ---------------------------------------------------------------------------------------------------
    
    // Boucle sur une date 
    let dateDebut = new Date('2024-01-01')
    let nbJour = 30
    for (let i = 0; i < nbJour; i++) {
    
      console.log(dateDebut.toDateString());
      logger.info('Date d\'import : ' + dateDebut.toDateString());
      [lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV,DonneesEtudeBNPV] = await RecupDonneesBNPV(poolSafetyEasy,objSubLowLevel,lstSubLowLevel,dateDebut)
      
      await insertSUSAR_EU(poolSusarEu,objSubLowLevel,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV,DonneesEtudeBNPV);
    
      let jourDapres = new Date(dateDebut);
      jourDapres.setDate(dateDebut.getDate() + 1);
      dateDebut = jourDapres;
    }
  
  // const effTbSUSAR_EU = await effaceTablesSUSAR_EU(connectionSusarEu)
  // const insTbSUSAR_EU = await insertDataSUSAR_EU(connectionSusarEu)
  
  await closePoolSafetyEasy(poolSafetyEasy)
  await closePoolSusarEu(poolSusarEu)
  
  logger.info('Fin import sur une plage de dates : Safety Easy => SUSAR_EU_v2');

  }

main()
  