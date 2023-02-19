require("dotenv").config();

const express = require("express");
const app = express();
const mysql = require("mysql");
const sanitizeHtml = require("sanitize-html");
const pool = require("./config/database.js");
const { genSaltSync, hashSync, compareSync } = require("bcrypt");
const cors = require("cors");
const { checkToken } = require("./config/checkToken.js");
const {
  sendingGet,
  sendingGetError,
  sendingGetById,
  sendingPost,
  sendingPut,
  sendingDelete,
  sendingInfo,
} = require("./config/sending.js");

//#region Middleware
//json-al kommunikáljon
app.use(express.json());
// mindenkivel enged kommunikálni
app.use(
  cors({
    origin: "*", //http://localhost:8080
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);
//autentikáció
app.use(checkToken);
//#endregion Middleware

//#region Users ---
app.get("/users", (req, res) => {
  let sql = `SELECT * FROM users`;

  pool.getConnection(function (error, connection) {
    if (error) {
      sendingGetError(res, "Server connecting error!");
      return;
    }
    connection.query(sql, async function (error, results, fields) {
      sendingGet(res, error, results);
    });
    connection.release();
  });
});

app.get("/users/:id", (req, res) => {
  const id = req.params.id;
  let sql = `
    SELECT * FROM users
    WHERE id = ?`;

  pool.getConnection(function (error, connection) {
    if (error) {
      sendingGetError(res, "Server connecting error!");
      return;
    }
    connection.query(sql, [id], async function (error, results, fields) {
      sendingGetById(res, error, results, id);
    });
    connection.release();
  });
});

//user létrehozás
app.post("/users", (req, res) => {
  const salt = genSaltSync(10);
  req.body.password = hashSync(req.body.password, salt);
  const newR = {
    firstName: mySanitizeHtml(req.body.firstName),
    lastName: mySanitizeHtml(req.body.lastName),
    gender: mySanitizeHtml(req.body.gender),
    userName: mySanitizeHtml(req.body.userName),
    email: mySanitizeHtml(req.body.email),
    password: req.body.password,
    number: +mySanitizeHtml(req.body.number),
  };

  //user ellenőrzés
  let sql = `select count(*) countUserEmail from users where userName = ?
    UNION all
    select count(*) countEmail from users where email = ?`;
  pool.getConnection(function (error, connection) {
    if (error) {
      sendingGetError(res, "Server connecting error!");
      return;
    }
    connection.query(
      sql,
      [newR.userName, newR.email],
      function (error, result, fields) {
        if (error) {
          sendingInfo(res, 0, "server error", [], 200);
          return;
        }
        if (result[0].countUserEmail >= 1 && result[1].countUserEmail >= 1) {
          sendingInfo(
            res,
            -3,
            "Username and password are already taken",
            newR,
            200
          );
          return;
        } else if (result[0].countUserEmail >= 1) {
          sendingInfo(res, -2, "Username are already taken", newR, 200);
          return;
        } else if (result[1].countUserEmail >= 1) {
          sendingInfo(res, -1, "Email are already taken", newR, 200);
          return;
        }
        //mehet a regisztráció

        sql = `insert into users
      (firstName, lastName, gender, userName, email, password, number)
      values
      (?,?,?,?,?,?,?)
    `;
        connection.query(
          sql,
          [
            newR.firstName,
            newR.lastName,
            newR.gender,
            newR.userName,
            newR.email,
            newR.password,
            newR.number,
          ],
          function (error, result, fields) {
            sendingPost(res, error, result, newR);
          }
        );
      }
    );
    connection.release();
  });
});

app.delete("/users/:id", (req, res) => {
  const id = req.params.id;
  let sql = `
    DELETE FROM users
    WHERE id = ?`;

  pool.getConnection(function (error, connection) {
    if (error) {
      sendingGetError(res, "Server connecting error!");
      return;
    }
    connection.query(sql, [id], function (error, result, fields) {
      sendingDelete(res, error, result, id);
    });
    connection.release();
  });
});

app.put("/users/:id", (req, res) => {
  const id = req.params.id;
  const salt = genSaltSync(10);
  let password = req.body.password;
  password = hashSync(password, salt);

  const newR = {
    firstName: mySanitizeHtml(req.body.firstName),
    lastName: mySanitizeHtml(req.body.lastName),
    gender: mySanitizeHtml(req.body.gender),
    userName: mySanitizeHtml(req.body.userName),
    email: mySanitizeHtml(req.body.email),
    password: password,
    number: +mySanitizeHtml(req.body.number),
  };
  let sql = `
    UPDATE users SET
    firstName = ?,
    lastName = ?,
    gender = ?,
    userName = ?,
    email = ?,
    password = ?,
    number = ?
    WHERE id = ?
      `;

  pool.getConnection(function (error, connection) {
    if (error) {
      sendingGetError(res, "Server connecting error!");
      return;
    }
    connection.query(
      sql,
      [
        newR.firstName,
        newR.lastName,
        newR.gender,
        newR.userName,
        newR.email,
        newR.password,
        newR.number,
        id,
      ],
      function (error, result, fields) {
        sendingPut(res, error, result, id, newR);
      }
    );
    connection.release();
  });
});

//#endregion Users

//#region cars ---
//A függvény egy promisszal tér vissza
function getTrips(res, carId) {
  return new Promise((resolve, reject) => {
    let sql = `
    SELECT id, numberOfMinits, DATE_FORMAT(date, '%Y.%m.%d %h:%i:%s') date, carId from trips
    WHERE carId = ?`;

    pool.getConnection(function (error, connection) {
      if (error) {
        sendingGetError(res, "Server connecting error!");
        return;
      }
      connection.query(sql, [carId], async function (error, results, fields) {
        if (error) {
          const message = "Trips sql error";
          sendingGetError(res, message);
        }
        //Az await miatt a car.trips a results-ot kapja értékül
        resolve(results);
      });
      connection.release();
    });
  });
}

//Csak a cars tábla
app.get("/cars", (req, res) => {
  let sql = `SELECT * FROM cars`;

  pool.getConnection(function (error, connection) {
    if (error) {
      sendingGetError(res, "Server connecting error!");
      return;
    }
    connection.query(sql, async function (error, results, fields) {
      if (error) {
        message = "Cars sql error";
        sendingGetError(res, message);
        return;
      }
      sendingGet(res, null, results);
    });
    connection.release();
  });
});

//Cars a Trip-jeivel
app.get("/carsWithTrips", (req, res) => {
  let sql = `SELECT * FROM cars`;

  pool.getConnection(function (error, connection) {
    if (error) {
      sendingGetError(res, "Server connecting error!");
      return;
    }
    connection.query(sql, async function (error, results, fields) {
      if (error) {
        message = "Cars sql error";
        sendingGetError(res, message);
        return;
      }

      //Végigmegyünk a kocsikon, és berakjuk a trips-eket
      for (const car of results) {
        //A promise a results-ot ada vissza
        car.trips = await getTrips(res, car.id);
      }
      sendingGet(res, null, results);
    });
    connection.release();
  });
});

//Cars és Trips táblák inner join
app.get("/carsTrips", (req, res) => {
  let sql = `select * from cars c
  inner join trips t on c.id = t.carId`;

  pool.getConnection(function (error, connection) {
    if (error) {
      sendingGetError(res, "Server connecting error!");
      return;
    }
    connection.query(sql, async function (error, results, fields) {
      if (error) {
        message = "Cars sql error";
        sendingGetError(res, message);
        return;
      }
      sendingGet(res, null, results);
    });
    connection.release();
  });
});

//Egy cars rekord
app.get("/cars/:id", (req, res) => {
  const id = req.params.id;
  let sql = `
    SELECT * FROM cars
    WHERE id = ?`;

  pool.getConnection(function (error, connection) {
    if (error) {
      sendingGetError(res, "Server connecting error!");
      return;
    }
    connection.query(sql, [id], async function (error, results, fields) {
      if (error) {
        const message = "Cars sql error";
        sendingGetError(res, message);
        return;
      }
      if (results.length == 0) {
        const message = `Not found id: ${id}`;
        sendingGetError(res, message);
        return;
      }
      sendingGetById(res, null, results[0], id);
    });
    connection.release();
  });
});

//egy cars rekord a tripsjeivel
app.get("/carsWithTrips/:id", (req, res) => {
  const id = req.params.id;
  let sql = `
    SELECT * FROM cars
    WHERE id = ?`;

  pool.getConnection(function (error, connection) {
    if (error) {
      sendingGetError(res, "Server connecting error!");
      return;
    }
    connection.query(sql, [id], async function (error, results, fields) {
      if (error) {
        const message = "Cars sql error";
        sendingGetError(res, message);
        return;
      }
      if (results.length == 0) {
        const message = `Not found id: ${id}`;
        sendingGetError(res, message);
        return;
      }
      results[0].trips = await getTrips(res, id);
      sendingGetById(res, null, results[0], id);
    });
    connection.release();
  });
});

//egy cars rekord a tripsjeivel
app.get("/carsTrips/:id", (req, res) => {
  const id = req.params.id;
  let sql = `
  select c.id, c.name, c.licenceNumber, c.hourlyRate, t.id, t.numberOfMinits, t.date, t.carId from cars c
  inner join trips t on c.id = t.carId
  where c.id = ?`;

  pool.getConnection(function (error, connection) {
    if (error) {
      sendingGetError(res, "Server connecting error!");
      return;
    }
    connection.query(sql, [id], async function (error, results, fields) {
      if (error) {
        const message = "Cars sql error";
        sendingGetError(res, message);
        return;
      }
      if (results.length == 0) {
        const message = `Not found id: ${id}`;
        sendingGetError(res, message);
        return;
      }
      sendingGetById(res, null, results, id);
    });
    connection.release();
  });
});

app.delete("/cars/:id", (req, res) => {
  const id = req.params.id;

  let sql = `
    DELETE FROM cars
    WHERE id = ?`;

  pool.getConnection(function (error, connection) {
    if (error) {
      sendingGetError(res, "Server connecting error!");
      return;
    }
    connection.query(sql, [id], function (error, result, fields) {
      sendingDelete(res, error, result, id);
    });
    connection.release();
  });
});

app.post("/cars", (req, res) => {
  const newR = {
    name: sanitizeHtml(req.body.name),
    licenceNumber: sanitizeHtml(req.body.licenceNumber),
    hourlyRate: +sanitizeHtml(req.body.hourlyRate),
  };
  let sql = `
    INSERT cars 
    (name, licenceNumber, hourlyRate)
    VALUES
    (?, ?, ?)
    `;
  pool.getConnection(function (error, connection) {
    if (error) {
      sendingGetError(res, "Server connecting error!");
      return;
    }
    connection.query(
      sql,
      [newR.name, newR.licenceNumber, newR.hourlyRate],
      function (error, result, fields) {
        sendingPost(res, error, result, newR);
      }
    );
    connection.release();
  });
});

app.put("/cars/:id", (req, res) => {
  const id = req.params.id;
  const newR = {
    name: sanitizeHtml(req.body.name),
    licenceNumber: sanitizeHtml(req.body.licenceNumber),
    hourlyRate: +sanitizeHtml(req.body.hourlyRate),
  };
  let sql = `
    UPDATE cars SET
    name = ?,
    licenceNumber = ?,
    hourlyRate = ?
    WHERE id = ?
      `;

  pool.getConnection(function (error, connection) {
    if (error) {
      sendingGetError(res, "Server connecting error!");
      return;
    }
    connection.query(
      sql,
      [newR.name, newR.licenceNumber, newR.hourlyRate, id],
      function (error, result, fields) {
        sendingPut(res, error, result, id, newR);
      }
    );
    connection.release();
  });
});
//#endregion cars

//#region trips ---
app.get("/tripsByCarId/:id", (req, res) => {
  const id = req.params.id;
  let sql = `
    SELECT id, numberOfMinits, DATE_FORMAT(date, '%Y.%m.%d %h:%i:%s') date, carId from trips
    WHERE carId = ?`;

  pool.getConnection(function (error, connection) {
    if (error) {
      sendingGetError(res, "Server connecting error!");
      return;
    }
    connection.query(sql, [id], function (error, results, fields) {
      sendingGetById(res, error, results, id);
    });
    connection.release();
  });
});

app.get("/trips/:id", (req, res) => {
  const id = req.params.id;
  let sql = `
    SELECT id, numberOfMinits, DATE_FORMAT(date, '%Y.%m.%d %h:%i:%s') date, carId from trips
    WHERE id = ?`;

  pool.getConnection(function (error, connection) {
    if (error) {
      sendingGetError(res, "Server connecting error!");
      return;
    }
    connection.query(sql, [id], function (error, results, fields) {
      sendingGetById(res, error, results, id);
    });
    connection.release();
  });
});

app.get("/trips", (req, res) => {
  let sql = `
    SELECT id, numberOfMinits, DATE_FORMAT(date, '%Y.%m.%d %h:%i:%s') date, carId from trips`;

  pool.getConnection(function (error, connection) {
    if (error) {
      sendingGetError(res, "Server connecting error!");
      return;
    }

    connection.query(sql, function (error, results, fields) {
      sendingGet(res, error, results);
    });

    connection.release();
  });
});

app.post("/trips", (req, res) => {
  const newR = {
    numberOfMinits: sanitizeHtml(req.body.numberOfMinits),
    date: sanitizeHtml(req.body.date),
    carId: +sanitizeHtml(req.body.carId),
  };

  let sql = `
  INSERT trips 
  (numberOfMinits, date, carId)
  VALUES
  (?, ?, ?)
    `;

  pool.getConnection(function (error, connection) {
    if (error) {
      sendingGetError(res, "Server connecting error!");
      return;
    }
    connection.query(
      sql,
      [newR.numberOfMinits, newR.date, newR.carId],
      function (error, result, fields) {
        sendingPost(res, error, result, newR);
      }
    );
    connection.release();
  });
});

app.put("/trips/:id", (req, res) => {
  const id = req.params.id;
  const newR = {
    numberOfMinits: sanitizeHtml(req.body.numberOfMinits),
    date: sanitizeHtml(req.body.date),
    carId: +sanitizeHtml(req.body.carId),
  };
  let sql = `
    UPDATE trips SET
    numberOfMinits = ?,
    date = ?,
    carId = ?
    WHERE id = ?
      `;

  pool.getConnection(function (error, connection) {
    if (error) {
      sendingGetError(res, "Server connecting error!");
      return;
    }
    connection.query(
      sql,
      [newR.numberOfMinits, newR.date, newR.carId, id],
      function (error, result, fields) {
        sendingPut(res, error, result, id, newR);
      }
    );
    connection.release();
  });
});
//#endregion trips

function mySanitizeHtml(data) {
  return sanitizeHtml(data, {
    allowedTags: [],
    allowedAttributes: {},
  });
}

app.listen(process.env.APP_PORT, () => {
  console.log(
    `Data server, listen port: ${process.env.APP_PORT} (Auth: ${
      process.env.AUTH_ON == 1 ? "on" : "off"
    })`
  );
});

module.exports = { genSaltSync, hashSync, compareSync };
