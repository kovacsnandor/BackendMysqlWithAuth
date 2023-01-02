const express = require("express");
const app = express();
const mysql = require("mysql");
const bodyParser = require("body-parser");

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
      res.send({ error: `sql error` });
      return;
    }
    if (results.length == 0) {
      res.send({ error: `Not found id: ${id}` });
      return;
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
      res.send({ error: `sql error` });
      return;
    }
    if (!result.affectedRows) {
      res.send({ error: `Not found id: ${id}` });
      return;
    }

    res.send({ id: id });
  });

  connection.end();
});

app.post("/cars", bodyParser.json(), (req, res) => {
  let connection = getConnection();
  connection.connect();
  const newCar = {
    name: req.body.name,
    licenceNumber: req.body.licenceNumber,
    hourlyRate: req.body.hourlyRate,
  };
  let sql = `
    INSERT cars 
    (name, licenceNumber, hourlyRate)
    VALUES
    (?, ?, ?)
    `;
  connection.query(
    sql,
    [newCar.name, newCar.licenceNumber, newCar.hourlyRate],
    function (error, result, fields) {
      if (error) {
        res.send({ error: `sql error` });
        return;
      }
      if (!result.affectedRows) {
        res.send({ error: `Insert falied` });
        return;
      }
      newCar.id = result.insertId
      res.send(newCar);
    }
  );

  connection.end();
});

app.listen(3000);
