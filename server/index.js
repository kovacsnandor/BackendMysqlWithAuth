const express = require("express");
const app = express();
const mysql = require("mysql");
const bodyParser = require("body-parser");
const sanitizeHtml = require("sanitize-html")


function getConnection() {
  return mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "cars",
  });
}

//A függvény egy promisszal tér vissza
function getTrips(carId) {
  return new Promise((res, rej) => {
    var connection = getConnection();
    connection.connect();

    let sql = `
    SELECT id, numberOfMinits, DATE_FORMAT(date, '%Y.%m.%d %h:%i:%s') date, carId from trips
    WHERE carId = ?`;
    connection.query(sql, [carId], async function (error, results, fields) {
      if (error) {
        console.log(error);
        return { error: "error" };
      }
      //Az await miatt a car.trips a results-ot kapja értékül
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
      //A promise a results-ot ada vissza
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
    name: sanitizeHtml(req.body.name),
    licenceNumber: sanitizeHtml(req.body.licenceNumber),
    hourlyRate: +sanitizeHtml(req.body.hourlyRate)
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
    name: sanitizeHtml(req.body.name),
    licenceNumber: sanitizeHtml(req.body.licenceNumber),
    hourlyRate: +sanitizeHtml(req.body.hourlyRate)
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

//trips ---------------
app.get("/tripsByCarId/:id", (req, res) => {
  const id = req.params.id;
  var connection = getConnection();
  connection.connect();

  let sql = `
    SELECT id, numberOfMinits, DATE_FORMAT(date, '%Y.%m.%d %h:%i:%s') date, carId from trips
    WHERE carId = ?`;

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

app.get("/trips/:id", (req, res) => {
  const id = req.params.id;
  var connection = getConnection();
  connection.connect();

  let sql = `
    SELECT id, numberOfMinits, DATE_FORMAT(date, '%Y.%m.%d %h:%i:%s') date, carId from trips
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

app.get("/trips", (req, res) => {
  const id = req.params.id;
  var connection = getConnection();
  connection.connect();

  let sql = `
    SELECT id, numberOfMinits, DATE_FORMAT(date, '%Y.%m.%d %h:%i:%s') date, carId from trips`;

  connection.query(sql, function (error, results, fields) {
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


app.post("/trips", bodyParser.json(), (req, res) => {
  let connection = getConnection();
  connection.connect();
  const newTrip = {
    numberOfMinits: sanitizeHtml(req.body.numberOfMinits),
    date: sanitizeHtml(req.body.date),
    carId: +sanitizeHtml(req.body.carId)
  };
  let sql = `
  INSERT trips 
  (numberOfMinits, date, carId)
  VALUES
  (?, ?, ?)
    `;
  connection.query(
    sql,
    [newTrip.numberOfMinits, newTrip.date, newTrip.carId],
    function (error, result, fields) {
      if (error) {
        res.send({ error: `sql error` });
        return;
      }
      if (!result.affectedRows) {
        res.send({ error: `Insert falied` });
        return;
      }
      newTrip.id = result.insertId;
      res.send(newTrip);
    }
  );

  connection.end();
});


app.put("/trips/:id", bodyParser.json(), (req, res) => {
  const id = req.params.id;
  let connection = getConnection();
  connection.connect();
  const newTrip = {
    numberOfMinits: sanitizeHtml(req.body.numberOfMinits),
    date: sanitizeHtml(req.body.date),
    carId: +sanitizeHtml(req.body.carId)
  };
  let sql = `
    UPDATE trips SET
    numberOfMinits = ?,
    date = ?,
    carId = ?
    WHERE id = ?
      `;
  connection.query(
    sql,
    [newTrip.numberOfMinits, newTrip.date, newTrip.carId, id],
    function (error, result, fields) {
      if (error) {
        res.send({ error: `sql error` });
        return;
      }
      if (!result.affectedRows) {
        res.send({ error: `Update falied` });
        return;
      }
      newTrip.id = id;
      res.send(newTrip);
    }
  );

  connection.end();
});



app.listen(3000);
