
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



  // const poolSusarEu = await createPoolSusarEu();
  // const connectionSusarEu = await poolSusarEu.getConnection();
  // // await effaceTablesSUSAR_EU (connectionSusarEu)
  // let a = await isSUSAR_EU_unique (connectionSusarEu,31719194,'EC2024015186',4)
  // console.log(a)
  // let b = await isSUSAR_EU_unique (connectionSusarEu,31719194,'EC2024015187',4)
  // console.log(b)
  // let c = await isSUSAR_EU_unique (connectionSusarEu,31719194,'EC2024015186',6)
  // console.log(c)
  // let d = await isSUSAR_EU_unique (connectionSusarEu,31719191,'EC2024015186',4)
  // console.log(d)
  // let e = await isSUSAR_EU_unique (connectionSusarEu,31719191,'EC2024015187',4)
  // console.log(e)
  // connectionSusarEu.release();
  // await closePoolSusarEu(poolSusarEu)

// const datePivotStatus = new Date()
// const NbJourAvant = 3
// const NbJourApres = 1

// const jourAvant = new Date(datePivotStatus - NbJourAvant * 24 * 60 * 60 * 1000);
// const jourApres = new Date(datePivotStatus + NbJourApres * 24 * 60 * 60 * 1000);
// const startDate = jourAvant.toISOString().slice(0, 10) + " 00:00:00"
// const endDate = jourApres.toISOString().slice(0, 10) + " 23:59:59"


//   // const today = new Date();
//   // const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
//   // const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
//   // const startDate = threeDaysAgo.toISOString().slice(0, 19).replace('T', ' ');
//   // const endDate = threeDaysFromNow.toISOString().slice(0, 19).replace('T', ' ');
//   // console.log("today",today)
//   // console.log("threeDaysAgo",threeDaysAgo)
//   // console.log("threeDaysFromNow",threeDaysFromNow)
//   console.log("startDate",startDate)
//   console.log("endDate",endDate)

let dateDebut = new Date('2024-02-01')
let nbJour = 30
for (let i = 0; i < nbJour; i++) {

  console.log(dateDebut.toDateString());
  // console.log(dateDebut.getDate());


  let jourDapres = new Date(dateDebut);
  jourDapres.setDate(dateDebut.getDate() + 1);
  
  // Utiliser la nouvelle date pour la prochaine itération
  dateDebut = jourDapres;
}