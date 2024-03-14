

  
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




  
export { 
    sauvegardeObjet,
    chargementObjet
};
