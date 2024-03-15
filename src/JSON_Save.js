

  
  import fs from 'fs';
  import path from 'path';



  async function sauvegardeObjet(obj, objName ) {
    // Créer le répertoire s'il n'existe pas déjà
    const jsonDir = '../JSON_Save';
    if (!fs.existsSync(jsonDir)) {
      fs.mkdirSync(jsonDir);
    }
    // Sérialisation de l'objet en JSON et écriture dans un fichier
    const jsonData = JSON.stringify(obj);
    const filePath = path.join(jsonDir, objName + '.json');
    fs.writeFileSync(filePath, jsonData);
}


async function chargementObjet(objName ) {
    // répertoire de sauvegarde
    const jsonDir = '../JSON_Save';
    const filePath = path.join(jsonDir, objName + '.json');
    // fs.writeFileSync(filePath, jsonData);


    const jsonString = fs.readFileSync(filePath, 'utf-8');
    const obj = JSON.parse(jsonString);
    return obj
}


const chargeObjBNPV_fromJSON = async () => {
    
  const objSubLowLevel_ = chargementObjet("objSubLowLevel")
  const lstSusarBNPV_ = chargementObjet("lstSusarBNPV")
  const MedicBNPV_ = chargementObjet("MedicBNPV")
  const EIBNPV_ = chargementObjet("EIBNPV")
  const MedHistBNPV_ = chargementObjet("MedHistBNPV")


  const [objSubLowLevel, lstSusarBNPV, MedicBNPV, EIBNPV, MedHistBNPV] = await Promise.all([objSubLowLevel_, lstSusarBNPV_, MedicBNPV_, EIBNPV_, MedHistBNPV_]);
  // console.log(MedHist.length);
  // // console.log(MedHist[0]);
  // const MedHistFilt =  MedHist.filter(objet => objet.master_id === 31713704);
  // console.log(MedHistFilt.length);
  
  
  // let i = 0
  // for (const susar of lstSusarBNPV) {
  //   i++

  //   console.log(susar['master_id'])

  //   // pour charger les médicaments
  //   const MedicsFiltre = MedicBNPV.filter(Medic => Medic.master_id === susar['master_id']);

  //   for (const Medic of MedicsFiltre) {
      
  //     // pour charger le high level substance name
  //     const objSubHighLevelFiltre = objSubLowLevel.filter(objSubLowLevel => objSubLowLevel.active_substance_high_le_low_level === Medic['substancename']);
  //     let highLevelSubName = "" 
  //     for (const highLevel of objSubHighLevelFiltre) {
  //       if (highLevelSubName.length == 0) {
  //         highLevelSubName = highLevel['active_substance_high_level']
  //       } else {
  //         highLevelSubName += "/" + highLevel['active_substance_high_level']
  //       }
  //     }

  //     // console.log(objSubhighLevelFiltre[0])
  //     console.log(Medic['NBBlock'] + " : " + 
  //                 Medic['NBBlock2'] + " - " +
  //                 Medic['productname'] + " / " + 
  //                 Medic['substancename'] + " (" +
  //                 Medic['productcharacterization'] + ") - " + 
  //                 highLevelSubName
  //                 )
  //   }


  //   // pour charger les effets indesirables

  //   console.log ("Effets indesirables : ")
  //   const EIFiltre = EIBNPV.filter(EI => EI.master_id === susar['master_id']);
  //   for (const EI of EIFiltre) {
  //     console.log(EI['codereactionmeddrapt'] + " : " + 
  //                 EI['reactionmeddrapt']  + " (" + 
  //                 EI['reactionstartdate'] + ")" 
  //                 )
  //   }


  //   // pour charger les effets indesirables

  //   console.log ("Medical history : ")
  //   const MedHistFiltre = MedHistBNPV.filter(MedHist => MedHist.master_id === susar['master_id']);
  //   for (const MedHist of MedHistFiltre) {


  //     if (MedHist['patientmedicalcomment']==='') {
  //       console.log(MedHist['code_PT'] + " : " + 
  //                   MedHist['lib_PT']
  //                   )
  //     } else {
  //       console.log(MedHist['code_PT'] + " : " + 
  //                   MedHist['lib_PT'] + " (" +
  //                   MedHist['patientmedicalcomment'] + ")"
  //                   )
  //     }

  //   }


  //   // pour tester, sort après 5 susars
  //   if (i>5) {
  //     break
  //   }
  // }

  return [
    objSubLowLevel,
    lstSusarBNPV,
    MedicBNPV,
    EIBNPV,
    MedHistBNPV
  ]

}


  
export { 
    sauvegardeObjet,
    chargementObjet,
    chargeObjBNPV_fromJSON
};
