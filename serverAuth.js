require("dotenv").config();

const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const pool = require("./config/database.js");
const { genSaltSync, hashSync, compareSync } = require("bcrypt");

const {
  sendingInfo
} = require("./config/sending.js");


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
      sendingInfo(res, 1, "login successfully", { accessToken: accessToken, refreshToken: refreshToken }, 200);

      console.log("accessToken /login:", accessToken);
      console.log("refreshToken /login:", refreshToken);
      console.log("refreshTokens /login:", refreshTokens);
      return;
    } else {
      sendingInfo(res, 1, "Invalid username or password", { accessToken: "", refreshToken: "" }, 200);
      return;
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
    sendingInfo(res, 0, "No sends token", [], 401);
    return
  }
  //Ha a küldött refresh token nincs benne a refreshTokens tömbben
  if (!refreshTokens.includes(refreshToken)) {
    sendingInfo(res, 0, "Unknown Refresh Token", [], 403);
    return;
  }

  //ellnőrizzük, hogy szabályos-e a token, és ha igen, megkapjuk a user-t
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, user) => {
    if (error) {
      sendingInfo(res, 0, "Invalid Token", [], 403);
    return;
    }
    let accessToken = generateAccessToken({ name: user.name });

    //mindkét tokent odaadjuk a token kérőnek
    //egyelőre a refresh token marad
    sendingInfo(res, 1, "accesToken sent", { accessToken: accessToken }, 200);
  });

  console.log("refreshTokens /token:", refreshTokens);
});

//Kijelentkezés a refresh tokennel
app.delete("/logout", (req, res) => {
  //eltüntetjük a refreshTokes-ből a küldött refreshToken-t
  refreshTokens = refreshTokens.filter((token) => token !== req.body.token);
  sendingInfo(res, 1, "Logout ok!", [], 402)
  console.log("refreshTokens /logout:", refreshTokens);
});

//Mindenkit kijelentkeztet (fejlesztési eszköz)
app.delete("/logoutall", (req, res) => {
  //eltüntetjük a refreshTokes-ből a küldött refreshToken-t
  refreshTokens = [];
  sendingInfo(res, 1, "Logout ok!", [], 402)
  console.log("refreshTokens /logoutall:", refreshTokens);
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
