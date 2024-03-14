
// ------------------------------------------------------------------------------------
// --  donne_objSubLowLevel : récupération de la table de correspondance high level / low level    --
// ------------------------------------------------------------------------------------

/**
 * 
 * @param {*} connectionSusarEu 
 * @returns : un objet avec le resultat de la requete
 */
const donne_objSubLowLevel = async (connectionSusarEu) => {
    const results = await connectionSusarEu.query(
      'SELECT * FROM active_substance_grouping WHERE active_substance_grouping.inactif = 0 ;'
    );
    // console.log(results[0][0])
    // console.log(results[0])
    // const lstSubLowLevel = results[0].map(obj => obj.active_substance_high_le_low_level);

    return results[0];
  }


  
export { 
    donne_objSubLowLevel
};