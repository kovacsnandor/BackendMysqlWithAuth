const express = require("express");
const app = express();
const mysql = require("mysql");
const bodyParser = require("body-parser");
const sanitizeHtml = require("sanitize-html")
const pool = require("./config/database.js")


//A függvény egy promisszal tér vissza
function getTrips(carId) {
  return new Promise((res, rej) => {

    let sql = `
    SELECT id, numberOfMinits, DATE_FORMAT(date, '%Y.%m.%d %h:%i:%s') date, carId from trips
    WHERE carId = ?`;
    pool.query(sql, [carId], async function (error, results, fields) {
      if (error) {
        console.log(error);
        return { error: "error" };
      }
      //Az await miatt a car.trips a results-ot kapja értékül
      res(results);
    });
  });
}

app.get("/cars", (req, res) => {

  let sql = `SELECT * FROM cars`;
  pool.query(sql, async function (error, results, fields) {
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

});

app.get("/cars/:id", (req, res) => {
  const id = req.params.id;

  let sql = `
    SELECT * FROM cars
    WHERE id = ?`;

  pool.query(sql, [id], async function (error, results, fields) {
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
});

app.delete("/cars/:id", (req, res) => {
  const id = req.params.id;

  let sql = `
    DELETE FROM cars
    WHERE id = ?`;

  pool.query(sql, [id], function (error, result, fields) {
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

});

app.post("/cars", bodyParser.json(), (req, res) => {
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
  pool.query(
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

});

app.put("/cars/:id", bodyParser.json(), (req, res) => {
  const id = req.params.id;
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
  pool.query(
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
});

//trips ---------------
app.get("/tripsByCarId/:id", (req, res) => {
  const id = req.params.id;
  let sql = `
    SELECT id, numberOfMinits, DATE_FORMAT(date, '%Y.%m.%d %h:%i:%s') date, carId from trips
    WHERE carId = ?`;

  pool.query(sql, [id], function (error, results, fields) {
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
});

app.get("/trips/:id", (req, res) => {
  const id = req.params.id;
  let sql = `
    SELECT id, numberOfMinits, DATE_FORMAT(date, '%Y.%m.%d %h:%i:%s') date, carId from trips
    WHERE id = ?`;

  pool.query(sql, [id], function (error, results, fields) {
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
});

app.get("/trips", (req, res) => {
  const id = req.params.id;
  let sql = `
    SELECT id, numberOfMinits, DATE_FORMAT(date, '%Y.%m.%d %h:%i:%s') date, carId from trips`;

  pool.query(sql, function (error, results, fields) {
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
});


app.post("/trips", bodyParser.json(), (req, res) => {
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
  pool.query(
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

});


app.put("/trips/:id", bodyParser.json(), (req, res) => {
  const id = req.params.id;
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
  pool.query(
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
});



app.listen(process.env.APP_PORT, () => {
  console.log(`Data server listen port: ${process.env.APP_PORT}`);
});
