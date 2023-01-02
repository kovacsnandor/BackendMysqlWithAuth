const express = require("express");
const app = express();
const mysql = require("mysql");

function getConnection() {
  return mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "cars",
  });
}

app.get("/cars", (req, res) => {
  var connection = getConnection();
  connection.connect();

  let sql = `SELECT * FROM cars`;
  connection.query(sql, function (error, results, fields) {
    if (error) {
      console.log(error);
      return;
    }
    res.send(results);
  });

  connection.end();
});

app.get("/cars/:id", (req, res) => {
  const id = req.params.id;
  var connection = getConnection();
  connection.connect();

  let sql = `
    SELECT * FROM cars
    WHERE id = ?`;

  connection.query(sql, [id], function (error, results, fields) {
    if (error) {
      console.log(error);
      res.send({error: `sql error`})
      return;
    }
    if (results.length == 0) {
        res.send({error: `Not found id: ${id}`})
        return
    }

    res.send(results);
  });

  connection.end();
});


app.delete("/cars/:id", (req, res) => {
    const id = req.params.id;
    var connection = getConnection();
    connection.connect();
  
    let sql = `
    DELETE FROM cars
    WHERE id = ?`;
  
    connection.query(sql, [id], function (error, result, fields) {
      if (error) {
        res.send({error: `sql error`})
        return;
      }
      if (!result.affectedRows) {
          res.send({error: `Not found id: ${id}`})
          return
      }
  
      res.send({id: id});
    });
  
    connection.end();
  });

  

app.listen(3000);
