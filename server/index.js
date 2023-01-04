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

function getTrips(carId) {
  return new Promise((res, rej) => {
    var connection = getConnection();
    connection.connect();

    let sql = `
      SELECT * from trips
      WHERE carId = ?
      `;
    connection.query(sql, [carId], async function (error, results, fields) {
      if (error) {
        console.log(error);
        return { error: "error" };
      }
      res(results);
    });
    connection.end();
  });
}

app.get("/cars", (req, res) => {
  var connection = getConnection();
  connection.connect();

  let sql = `SELECT * FROM cars`;
  connection.query(sql, async function (error, results, fields) {
    if (error) {
      console.log(error);
      return;
    }

    //Végigmegyünk a kocsikon, és berakjuk a trips-eket
    for (const car of results) {
      car.trips = await getTrips(car.id);
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

  connection.query(sql, [id], async function (error, results, fields) {
    if (error) {
      console.log(error);
      res.send({ error: `sql error` });
      return;
    }
    if (results.length == 0) {
      res.send({ error: `Not found id: ${id}` });
      return;
    }
    results[0].trips = await getTrips(id);
    res.send(results[0]);
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
      newCar.id = result.insertId;
      res.send(newCar);
    }
  );

  connection.end();
});

app.put("/cars/:id", bodyParser.json(), (req, res) => {
  const id = req.params.id;
  let connection = getConnection();
  connection.connect();
  const updatedCar = {
    name: req.body.name,
    licenceNumber: req.body.licenceNumber,
    hourlyRate: req.body.hourlyRate,
  };
  let sql = `
    UPDATE cars SET
    name = ?,
    licenceNumber = ?,
    hourlyRate = ?
    WHERE id = ?
      `;
  connection.query(
    sql,
    [updatedCar.name, updatedCar.licenceNumber, updatedCar.hourlyRate, id],
    function (error, result, fields) {
      if (error) {
        res.send({ error: `sql error` });
        return;
      }
      if (!result.affectedRows) {
        res.send({ error: `Insert falied` });
        return;
      }
      updatedCar.id = id;
      res.send(updatedCar);
    }
  );

  connection.end();
});

app.listen(3000);
