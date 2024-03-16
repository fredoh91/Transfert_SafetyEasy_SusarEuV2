
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



  const poolSusarEu = await createPoolSusarEu();
  // const poolSafetyEasy = await createPoolSafetyEasy();

  // // const [objSubLowLevel,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV] = await RecupDonneesBNPV(poolSusarEu,poolSafetyEasy)
  // await closePoolSafetyEasy(poolSafetyEasy)
  
  // const [objSubLowLevel,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV] = await chargeObjBNPV_fromJSON()
  
  // await insertSUSAR_EU(poolSusarEu,objSubLowLevel,lstSusarBNPV,MedicBNPV,EIBNPV,MedHistBNPV);

  // const effTbSUSAR_EU = await effaceTablesSUSAR_EU(connectionSusarEu)
  // const insTbSUSAR_EU = await insertDataSUSAR_EU(connectionSusarEu)

  const connectionSusarEu = await poolSusarEu.getConnection();
  // await effaceTablesSUSAR_EU (connectionSusarEu)
  let a = await isSUSAR_EU_unique (connectionSusarEu,31719194,'EC2024015186',4)
  console.log(a)
  let b = await isSUSAR_EU_unique (connectionSusarEu,31719194,'EC2024015187',4)
  console.log(b)
  let c = await isSUSAR_EU_unique (connectionSusarEu,31719194,'EC2024015186',6)
  console.log(c)
  let d = await isSUSAR_EU_unique (connectionSusarEu,31719191,'EC2024015186',4)
  console.log(d)
  let e = await isSUSAR_EU_unique (connectionSusarEu,31719191,'EC2024015187',4)
  console.log(e)
  connectionSusarEu.release();


  await closePoolSusarEu(poolSusarEu)



  