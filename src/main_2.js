// const {
//     createConnectionSusarEu,
//     closeConnectionSusarEu,
//     createConnectionSafetyEasy,
//     closeConnectionSafetyEasy,
//     getConnectionSusarEu,
//     getConnectionSafetyEasy
//   } = require('./db/db_2');

// import { fileURLToPath } from 'url';
// import path from 'path';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// console.log(__filename);
// console.log(__dirname);
// stop()
//   import { createConnectionSusarEu, closeConnectionSusarEu, getConnectionSusarEu } from '.\db\db_2.js';
  import { 
    createConnectionSusarEu, 
    closeConnectionSusarEu, 
    susarEuConnection,
    createPoolSusarEu,
    closePoolSusarEu,
    createPoolSafetyEasy,
    closePoolSafetyEasy
  } from './db/db_2.js';
  
  


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
        return { connectionSusarEu, lstSubLowLevel, poolSafetyEasy };
      })

      .then(async ({ connectionSusarEu, lstSubLowLevel, poolSafetyEasy }) => {
        const connectionSafetyEasy = await poolSafetyEasy.getConnection();
        // const substanceNames = lstSubLowLevel.map(name => `'${name}'`).join(',');
        const lstSubLowLevelEscaped = lstSubLowLevel.map(name => name.replace(/'/g, "\\'"));
        const substanceNames = lstSubLowLevelEscaped.map(name => "'" + name + "'").join(',');
        const today = new Date();
        const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
        const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
        
        const startDate = threeDaysAgo.toISOString().slice(0, 19).replace('T', ' ');
        const endDate = threeDaysFromNow.toISOString().slice(0, 19).replace('T', ' ');

        const [idBNPV] = await connectionSafetyEasy.query(
          // "SELECT mv.specificcaseid AS id_prod FROM master_versions mv WHERE mv.specificcaseid = 'EC2022223544';"
          "SELECT DISTINCT mv.specificcaseid AS id_prod " + 
          "FROM " + 
          "master_versions mv " + 
          "INNER JOIN bi_product pr ON mv.id = pr.master_id " + 
          "LEFT JOIN bi_product_substance su ON pr.master_id = su.master_id " + 
          "AND pr.NBBlock = su.NBBlock " + 
          "LEFT JOIN bi_caseinfo ci ON mv.id = ci.master_id " + 
        "WHERE " + 
          "1 = 1 " + 
          "AND mv.CreationDate BETWEEN '" + startDate + "' AND '" + endDate + "' " + 
          "AND specificcaseid LIKE 'EC%' " + 
          "AND ci.casenullification <> 'Nullification' " + 
          "AND su.substancename IN ( " + substanceNames + ");"

          );
          connectionSafetyEasy.release();
          closePoolSafetyEasy(poolSafetyEasy);
          return { connectionSusarEu, lstSubLowLevel, idBNPV };
        })
      .then(({ connectionSusarEu, lstSubLowLevel, idBNPV }) => {
        // Faites ce que vous voulez avec lstSubLowLevel ici
        
      // console.log(lstSubLowLevel);
      // console.log(substanceNames);
      console.log(idBNPV)
      connectionSusarEu.release();
      closePoolSusarEu(poolSusarEu);
    })
    .catch(err => {
      console.error('An error occurred:', err);
      throw err;
    });
  };


  // function processResults(connectionSusarEu, lstSubLowLevel, poolSafetyEasy) {
  //   return poolSafetyEasy.getConnection()
  //     .then(connectionSafetyEasy => connectionSafetyEasy.query(
  //       "SELECT mv.specificcaseid AS id_prod FROM master_versions mv WHERE mv.specificcaseid = 'EC2022223544';"
  //     ))
  //     .then(([idBNPV]) => {
  //       connectionSafetyEasy.release();
  //       closePoolSafetyEasy(poolSafetyEasy);
  
  //       return { connectionSusarEu, lstSubLowLevel, idBNPV };
  //     });
  // }
  
  function processResults(connectionSusarEu, lstSubLowLevel, poolSafetyEasy) {
    return poolSafetyEasy.getConnection()
      .then(connectionSafetyEasy => {
      return connectionSafetyEasy.query(
        "SELECT mv.specificcaseid AS id_prod FROM master_versions mv WHERE mv.specificcaseid = 'EC2022223544';"
      ).then(([idBNPV]) => {
        
  
        connectionSafetyEasy.release();
        closePoolSafetyEasy(poolSafetyEasy);
  
        return { connectionSusarEu, lstSubLowLevel, idBNPV };
      });
    });
  }
  


  
  // const main = async () => {

  //   const poolSusarEu = await createPoolSusarEu();
  //   const connectionSusarEu = await poolSusarEu.getConnection();
  //   const poolSafetyEasy = await createPoolSafetyEasy();
  //   const connectionSafetyEasy = await poolSafetyEasy.getConnection();



  //   try {
  //     const [results] = await connectionSusarEu.query(
  //       'SELECT * FROM active_substance_grouping WHERE active_substance_grouping.inactif = 0 ;'
  //     );
  //     const lstSubLowLevel = results.map(obj => obj.active_substance_high_le_low_level);
  //     console.log(lstSubLowLevel);
  //     return lstSubLowLevel;
  //   } catch (err) {
  //     console.error('An error occurred:', err);
  //     throw err;
  //   } finally {
  //     connectionSusarEu.release();
  //     closePoolSusarEu(poolSusarEu);
  //   }
  //   try {
  //     const [results] = await connectionSafetyEasy.query(
  //       "SELECT mv.specificcaseid AS id_prod FROM master_versions mv WHERE mv.specificcaseid = 'EC2022223544';"
  //     );

  //     console.log(results)
  //     // const BNPV = results.map(obj => obj.active_substance_high_le_low_level);
  //     // console.log(BNPV);
  //     // return BNPV;
  //   } catch (err) {
  //     console.error('An error occurred:', err);
  //     throw err;
  //   } finally {
  //     connectionSafetyEasy.release();
  //     closePoolSafetyEasy(poolSafetyEasy);
  //   }
  // };

  // const main = async () => {
  //   createConnectionSusarEu()
  //     .then(susarEuConnection => {
  //       return susarEuConnection.query(
  //         'SELECT * FROM active_substance_grouping WHERE active_substance_grouping.inactif = 0 ;'
  //       );
  //     })
  //     .then(([results, fields]) => {
  //       const lstSubLowLevel = results.map(obj => obj.active_substance_high_le_low_level);
  //       console.log(lstSubLowLevel);
  //       return closeConnectionSusarEu(susarEuConnection);
  //     })
  //     .catch(err => {
  //       console.error('An error occurred:', err);
  //     });
  // };


// let lstSubLowLevel = []


  // const main = async () => {
  //   try {

  //       // console.log("un")
  //       const susarEuConnection = await createConnectionSusarEu();
  //     // console.log("deux")


  //   //   const susarEuConnection = susarEuConnection();

  //   // console.log(susarEuConnection)

  //   try {
  //       const [results, fields] = await susarEuConnection.query(
  //         'SELECT * FROM 	active_substance_grouping WHERE active_substance_grouping.inactif = 0 ;'
  //       );
  //       const lstSubLowLevel = results.map(obj => obj.active_substance_high_le_low_level)
  //       console.log(lstSubLowLevel)
  //       // console.log(results); // results contains rows returned by server
  //       console.log(fields); // fields contains extra meta data about results, if available
  //     } catch (err) {
  //       console.log(err);
  //     }


  //     // console.log("trois")
  //     // Faites ce que vous voulez avec la connexion...
  //     await closeConnectionSusarEu(susarEuConnection);
  //     // console.log("quatre")
  //   //   await createConnectionSafetyEasy();
  //   //   const safetyEasyConnection = getConnectionSafetyEasy();
  //   //   // Faites ce que vous voulez avec la connexion...
  //   //   await closeConnectionSafetyEasy();
  //   } catch (err) {
  //     console.error('An error occurred:', err);
  //   }
  // };
  
  main();
  