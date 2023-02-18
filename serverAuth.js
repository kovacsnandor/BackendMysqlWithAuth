require("dotenv").config();

const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const pool = require("./config/database.js");
const { genSaltSync, hashSync, compareSync } = require("bcrypt");

app.use(express.json());
//itt tároljuk a refrest tokeneket
refreshTokens = [];

// A bejelenkezés
app.post("/login", (req, res) => {
  const userName = req.body.userName;
  const password = req.body.password;

  //Megvan-e a user
  getUserByUserEmail(userName, (err, results) => {
    if (err) {
      console.log(err);
    }
    if (!results) {
      return res.json({
        success: 0,
        message: "Invalid username or password",
        accessToken: "",
        refreshToken: "",
      });
    }

    //jó-e a megadott jelszó?
    const passwordOk = compareSync(password, results.password);
    if (passwordOk) {
      const user = { name: userName };

      //Létrehozunk egy időkorlátos normál tokent
      let accessToken = generateAccessToken(user);
      //és egy korlátlan idejű refresh tokent
      let refreshToken = generateRefreshToken(user);

      //tároljuk a refreshToken-t
      refreshTokens.push(refreshToken);

      //mindkét tokent odaadjuk a bejelentkezőnek
      res.json({
        success: 1,
        message: "login successfully",
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
      console.log("accessToken /login:", accessToken);
      console.log("refreshToken /login:", refreshToken);
      console.log("refreshTokens /login:", refreshTokens);
      return;
    } else {
      //hibás jelszó
      return res.json({
        success: 0,
        message: "Invalid username or password",
        accessToken: "",
        refreshToken: "",
      });
    }
  });
});

function getUserByUserEmail(userName, callBack) {
  let queryString = `select * from users where userName = ?`;
  let params = [userName];
  pool.query(queryString, params, (error, results, fields) => {
    if (error) {
      callBack(error);
    }
    return callBack(null, results[0]);
  });
}

app.post("/token", (req, res) => {
  let refreshToken = req.body.token;
  // nem küldtünk tokent
  if (refreshToken == null) {
    return res.sendStatus(401);
  }
  //Ha a küldött refresh token nincs benne a refreshTokens tömbben
  if (!refreshTokens.includes(refreshToken)) {
    return res.sendStatus(403);
  }

  //ellnőrizzük, hogy szabályos-e a token, és ha igen, megkapjuk a user-t
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, user) => {
    if (error) {
      return res.sendStatus(403);
    }
    let accessToken = generateAccessToken({ name: user.name });

    //mindkét tokent odaadjuk a token kérőnek
    //egyelőre a refresh token marad
    res.json({ accessToken: accessToken });
  });

  console.log("refreshTokens /token:", refreshTokens);
});

app.delete("/logout", (req, res) => {
  //eltüntetjük a refreshTokes-ből a küldött refreshToken-t
  console.log("xx", req.body.token);
  refreshTokens = refreshTokens.filter((token) => token !== req.body.token);
  res.sendStatus(402);
  console.log("refreshTokens /logout:", refreshTokens);
});

//Normál token generátor időkorláttal, ha nincs időkorlát, korlátlant ad
function generateAccessToken(user) {
  if (process.env.ACCESS_TIME) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.ACCESS_TIME,
    });
  } else {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
  }
}

//refreshTiken generátor
function generateRefreshToken(user) {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
}

//accessToken generátor
app.listen(process.env.AUTH_PORT, () => {
  console.log(`Auth server, listen: port: ${process.env.AUTH_PORT}`);
});
