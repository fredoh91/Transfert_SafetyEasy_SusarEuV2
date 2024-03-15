
// ------------------------------------------------------------------------------------
// --  donne_objSubLowLevel : récupération de la table de correspondance high level / low level    --
// ------------------------------------------------------------------------------------
/**
 * 
 * @param {*} connectionSusarEu 
 * @returns : un objet avec le resultat de la requete
 */
async function  donne_objSubLowLevel (connectionSusarEu) {
    const results = await connectionSusarEu.query(
      'SELECT * FROM active_substance_grouping WHERE active_substance_grouping.inactif = 0 ;'
    );
    // console.log(results[0][0])
    // console.log(results[0])
    // const lstSubLowLevel = results[0].map(obj => obj.active_substance_high_le_low_level);

    return results[0];
  }



// ------------------------------------------------------------------------------------
// --  effaceTablesSUSAR_EU : Efface les tables SUSAR_EU avant import pour DEV    --
// ------------------------------------------------------------------------------------
/**
   * 
   * @param {*} connectionSusarEu 
   */
  async function effaceTablesSUSAR_EU (connectionSusarEu) {
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
      // await closePoolSusarEu(poolSusarEu)
    }
  }
  
export { 
    donne_objSubLowLevel,
    effaceTablesSUSAR_EU
};