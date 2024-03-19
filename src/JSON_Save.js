/**
 * @typedef {import('./types').active_substance_grouping} active_substance_grouping
 * @typedef {import('./types').susar_eu} susar_eu
 * @typedef {import('./types').medicaments} medicaments
 * @typedef {import('./types').effets_indesirables} effets_indesirables
 * @typedef {import('./types').medical_history} medical_history
 * @typedef {import('./types').donnees_etude} donnees_etude
 * 
 */

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

/**
 * 
 * @returns {Array<[
 *    active_substance_grouping[], 
 *    susar_eu[], 
 *    medicaments[], 
 *    effets_indesirables[], 
 *    medical_history[], 
 *    donnees_etude[]
 * ]>}
 */
async function chargeObjBNPV_fromJSON() {

  const objSubLowLevel_ = chargementObjet("objSubLowLevel")
  const lstSusarBNPV_ = chargementObjet("lstSusarBNPV")
  const MedicBNPV_ = chargementObjet("MedicBNPV")
  const EIBNPV_ = chargementObjet("EIBNPV")
  const MedHistBNPV_ = chargementObjet("MedHistBNPV")
  const DonneesEtudeBNPV_ = chargementObjet("DonneesEtudeBNPV")

  const [
    objSubLowLevel, 
    lstSusarBNPV, 
    MedicBNPV, 
    EIBNPV, 
    MedHistBNPV, 
    DonneesEtudeBNPV
  ] = await Promise.all([
                    objSubLowLevel_, 
                    lstSusarBNPV_, 
                    MedicBNPV_, 
                    EIBNPV_, 
                    MedHistBNPV_, 
                    DonneesEtudeBNPV_
                  ]);

  return [
    objSubLowLevel,
    lstSusarBNPV,
    MedicBNPV,
    EIBNPV,
    MedHistBNPV,
    DonneesEtudeBNPV
  ]
}


  
export { 
    sauvegardeObjet,
    chargementObjet,
    chargeObjBNPV_fromJSON
};
