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
    WHERE id = ${id}`;

  connection.query(sql, function (error, results, fields) {
    if (error) {
      console.log(error);
      return;
    }
    res.send(results);
  });

  connection.end();
});

app.listen(3000);
