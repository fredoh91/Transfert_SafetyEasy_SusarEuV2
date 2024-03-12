
  import { 
    createPoolSusarEu,
    closePoolSusarEu,
    createPoolSafetyEasy,
    closePoolSafetyEasy
  } from './db/db.js';
  
  import {
    getSusarBNPV,
    getMedicBNPV
  } from './db/safetyEasyQueries.js'
  
  const main = async () => {
    const poolSusarEu = await createPoolSusarEu();
    const poolSafetyEasy = await createPoolSafetyEasy();
  
    poolSusarEu.getConnection()
      .then(async connectionSusarEu => {
        const results = await connectionSusarEu.query(
          'SELECT * FROM active_substance_grouping WHERE active_substance_grouping.inactif = 0 ;'
        );
        // console.log(results[0][0])
        const lstSubLowLevel = results[0].map(obj => obj.active_substance_high_le_low_level);
        return {poolSafetyEasy, connectionSusarEu, lstSubLowLevel};
      })
      // récupération des SUSAR depuis la BNPV
      .then(async ({ poolSafetyEasy, connectionSusarEu, lstSubLowLevel }) => {
        return getSusarBNPV(poolSafetyEasy, connectionSusarEu, lstSubLowLevel);
      })
      .then(({ connectionSusarEu, lstSubLowLevel, LstSusarBNPV }) => {
      // console.log(lstSubLowLevel);
      // console.log(substanceNames);
      // console.log(BNPV)
      const lstMasterId = LstSusarBNPV.map(obj => obj.id);
      // console.log(lstMasterId);
      // connectionSusarEu.release();
      return { poolSafetyEasy, connectionSusarEu, LstSusarBNPV, lstMasterId };
    })
    // récupération des médicaments des SUSAR depuis la BNPV
    .then(async ({ poolSafetyEasy, connectionSusarEu, LstSusarBNPV, lstMasterId }) => {
      return getMedicBNPV(poolSafetyEasy, connectionSusarEu, LstSusarBNPV, lstMasterId);
    })
    .then(({ connectionSusarEu, LstSusarBNPV, lstMasterId, Medic }) => {

      
    // console.log(lstSubLowLevel);
    // console.log(substanceNames);
    // console.log(BNPV)
    // const lstMasterId = BNPV.map(obj => obj.id);
    console.log(Medic);
    connectionSusarEu.release();

  })

    .catch(err => {
      console.error('An error occurred:', err);
      throw err;
    })
    .finally(() => {
      // Fermeture des connexions et libération des ressources
      // connectionSusarEu.release();
      closePoolSusarEu(poolSusarEu);
      // connectionSafetyEasy.release();
      closePoolSafetyEasy(poolSafetyEasy);
    });
  };

  // async function getIdBNPV(connectionSusarEu, lstSubLowLevel, poolSafetyEasy) {
  //   const connectionSafetyEasy = await poolSafetyEasy.getConnection();
  //   const lstSubLowLevelEscaped = lstSubLowLevel.map(name => name.replace(/'/g, "\\'"));
  //   const substanceNames = lstSubLowLevelEscaped.map(name => "'" + name + "'").join(',');
  //   const today = new Date();
  //   const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
  //   const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
  
  //   const startDate = threeDaysAgo.toISOString().slice(0, 19).replace('T', ' ');
  //   const endDate = threeDaysFromNow.toISOString().slice(0, 19).replace('T', ' ');
  
  //   const [idBNPV] = await connectionSafetyEasy.query(
  //     "SELECT DISTINCT mv.specificcaseid AS id_prod " +
  //     "FROM " +
  //     "master_versions mv " +
  //     "INNER JOIN bi_product pr ON mv.id = pr.master_id " +
  //     "LEFT JOIN bi_product_substance su ON pr.master_id = su.master_id " +
  //     "AND pr.NBBlock = su.NBBlock " +
  //     "LEFT JOIN bi_caseinfo ci ON mv.id = ci.master_id " +
  //     "WHERE " +
  //     "1 = 1 " +
  //     "AND mv.CreationDate BETWEEN '" + startDate + "' AND '" + endDate + "' " +
  //     "AND specificcaseid LIKE 'EC%' " +
  //     "AND ci.casenullification <> 'Nullification' " +
  //     "AND su.substancename IN ( " + substanceNames + ");"
  //   );
  
  //   connectionSafetyEasy.release();
  
  //   return { connectionSusarEu, lstSubLowLevel, idBNPV };
  // }

  main();
  