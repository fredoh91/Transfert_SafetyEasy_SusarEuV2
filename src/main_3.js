// const mysql = require('mysql2/promise');

// Get the client
import mysql from 'mysql2/promise';


// Crée une connexion à la base de données MySQL
const connection = await mysql.createConnection({
  host: 'localhost', 
  user: 'susar_eu_v2', 
  password: 'mxLLv86NFb35', 
  database: 'susar_eu_v2'
});

// // Create the connection to database
// const connection = await mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   database: 'test',
// });

// A simple SELECT query
try {
  const [results, fields] = await connection.query(
    'SELECT * FROM 	active_substance_grouping WHERE active_substance_grouping.inactif = 0 ;'
  );

  console.log(results); // results contains rows returned by server
  console.log(fields); // fields contains extra meta data about results, if available
} catch (err) {
  console.log(err);
}

// // Using placeholders
// try {
//   const [results] = await connection.query(
//     'SELECT * FROM `table` WHERE `name` = ? AND `age` > ?',
//     ['Page', 45]
//   );

//   console.log(results);
// } catch (err) {
//   console.log(err);
// }


module.exports = connection;