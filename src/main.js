
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




  const insertSUSAR_EU = async (poolSusarEu,objSubLowLevel,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV,DonneesEtudeBNPV) => {
    const connectionSusarEu = await poolSusarEu.getConnection();
    // await effaceTablesSUSAR_EU (connectionSusarEu)
    await insertDataSUSAR_EU(connectionSusarEu,objSubLowLevel,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV,DonneesEtudeBNPV)
    await connectionSusarEu.release();
  }





  // traitement principal

  const poolSusarEu = await createPoolSusarEu();
  const poolSafetyEasy = await createPoolSafetyEasy();

const typeSourceDonnees = "Base"
// const typeSourceDonnees = "Json"

let objSubLowLevel
let lstSubLowLevel
let lstSusarBNPV
let MedicBNPV
let EIBNPV
let MedHistBNPV
let DonneesEtudeBNPV

if (typeSourceDonnees == "Base") {
  
  // ------------------------------------------------------------------------------------------------------
  // --      début de la requete dans SUSAR_EU pour récupérer la liste des low-level substance name      --
  // ------------------------------------------------------------------------------------------------------
  const connectionSusarEu = await poolSusarEu.getConnection();
  
  // const [objSubLowLevel,lstSubLowLevel] = await donne_lstSubLowLevel(connectionSusarEu)
  [objSubLowLevel,lstSubLowLevel] = await donne_lstSubLowLevel(connectionSusarEu)
  // console.log(objSubLowLevel)
  // console.log(lstSubLowLevel)
  
  connectionSusarEu.release();
  // ---------------------------------------------------------------------------------------------------
  // --      fin des requetes dans SUSAR_EU pour récupérer la liste des low-level substance name      --
  // ---------------------------------------------------------------------------------------------------
  
  
  [lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV,DonneesEtudeBNPV] = await RecupDonneesBNPV(poolSafetyEasy,objSubLowLevel,lstSubLowLevel)


} else if (typeSourceDonnees == "Json") {

  [objSubLowLevel,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV,DonneesEtudeBNPV] = await chargeObjBNPV_fromJSON()

}

  await closePoolSafetyEasy(poolSafetyEasy)

  
  await insertSUSAR_EU(poolSusarEu,objSubLowLevel,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV,DonneesEtudeBNPV);

  // const effTbSUSAR_EU = await effaceTablesSUSAR_EU(connectionSusarEu)
  // const insTbSUSAR_EU = await insertDataSUSAR_EU(connectionSusarEu)

  await closePoolSusarEu(poolSusarEu)



  