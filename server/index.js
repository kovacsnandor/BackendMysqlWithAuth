const express = require('express')
const app = express()

app.get('/cars',  (req, res) => {
  var mysql      = require('mysql');
  var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'cars'
  });
   
  connection.connect();
  
  let sql = `SELECT * FROM cars`
  connection.query(sql, function (error, results, fields) {
    if (error) {
        console.log(error);
        return
    };
    res.send(results);
  });
   
  connection.end();

})

app.listen(3000)