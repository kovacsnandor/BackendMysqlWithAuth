# Adatbázis létrehozás
- branch: `01_Adatbázis_Létrehozás`

## MySQL idegen kulcs megkötések
![adatbázis diagram](database_document/Diagram2_taxi5.jpg)

## Teszt adatok
### Kézi generálás

### Tárolt eljárás: tesztAdatokKezi

### Tárolt eljárás: tesztAdatokAutomata
- Linkek
  - [random nevek](https://thecodecave.com/generating-random-names-in-mysql/)
    - [ELT function](https://www.w3resource.com/mysql/string-functions/mysql-elt-function.php)
  - [random integer](https://stackoverflow.com/questions/6550155/mysql-get-a-random-value-between-two-values)
  - [for loop](https://stackoverflow.com/questions/5125096/for-loop-example-in-mysql)

# Server létrehozás
- branch: `02_Express_Server`

## Fájlok, szerkezet kialakítása
- Server: `server/index.js`
- Kliens helye: `server/views`
- Statikus fájlok helye: `server/public`

## package json
- Átlépés a server mappába: `cd server`
- package.json telepítése: `npm init`

## Letöltendő modulok
Globális: 
- nodemon (ha még nincs letöltve): `npm i -g nodemon`
Lokális:
- [express](https://www.npmjs.com/package/express): `npm i express`
- [mysql](https://www.npmjs.com/package/mysql): `mpm i mysql`
- [sanitize-html](https://www.npmjs.com/package/sanitize-html): `npm i sanitize-html`
- [dotenv](https://www.npmjs.com/package/dotenv): `npm i dotenv`
- [bcrypt](https://www.npmjs.com/package/bcrypt): `npm i bcrypt`
- [cors](https://www.npmjs.com/package/cors): `npm i cors`
- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken): `npm i jsonwebtoken`


## dev script megírása (package.json)
```json
"scripts": {
    "dev": "nodemon serverData.js",
    "devauth": "nodemon serverAuth.js"
  },
```

## Projekt indítása
1. Data szerver indítása: `npm run dev`
2. Auth szerver indítása: `npm run devauth`

# Csatlakozás az adatbázishoz
- branch: `03_Connect_Mysql`

A mysql-npm alapján:
```js
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
```

# Sql Injections
- branch: `04_Sql_Injection`
[A 10 leggyakoribb támadástípus](https://owasp.org/www-project-top-ten/)

## Támadások sql-ből
```sql
# sql injection
# union
SELECT * FROM cars union SELECT * FROM cars;
SELECT * FROM cars UNION ALL SELECT * FROM cars;
SELECT * FROM cars union SELECT *, '' FROM users;

# Mi az adatbázis neve
SELECT * FROM cars
  WHERE id = 1 UNION SELECT database(), '', '', '';

# Milyen táblák vannak
SELECT * FROM cars
  WHERE id = 1 union select table_name, '','', '' from information_schema.tables where table_schema='cars';

# cars tábla oszlopai
SELECT * FROM cars
  WHERE id = 1 union select column_name, '', '', data_type from information_schema.columns where table_name='users' and table_schema='cars';

# user adatok kilopása
SELECT * FROM cars
  WHERE id = 1 union select email, password, '','' from users;
```

## Az sql injection-el támadható kód
- Egy sql kód akkor támadható, ha belefűzzük a sztringbe a paramétert:
```js
app.get("/cars/:id", (req, res) => {
  const id = req.params.id;
  var connection = getConnection();
  connection.connect();

  //támadható megoldás: az sql sztringbe fűzött paraméter
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
```

## Az sql injection kivédése
- place holder karakter: ?
```js
app.get("/cars/:id", (req, res) => {
  const id = req.params.id;
  var connection = getConnection();
  connection.connect();

  //Paraméterezett sql sztring: ?
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
```

# 05_Mysql_Műveletek
- branch: `05_Mysql_Műveletek`

## Az sql nyelv részei
- Data Definition Language: `DDL`
    - pl.: `CREATE TABLE ...`
- Data Query Language: `DQL`
    - pl.: `SELECT * FROM cars`
- Data Manipulation Language: `DML`
    - pl.: `DELETE FROM cars`
   
# Lekérdezések bővítés
- branch: 06_Lekérdezések_Bővítés

## trips hozzárakása a cars-hoz
A `get /cars` és `get /cars/:id`-nél ilyen választ generálunk:
```json
[
  {
    "id": 1,
    "name": "BMW",
    "licenceNumber": "BM-1928",
    "hourlyRate": 2810,
    "trips": [
      {
        "id": 9,
        "numberOfMinits": 56,
        "date": "2022-10-13T11:36:00.000Z",
        "carId": 1
      },
      {
        "id": 10,
        "numberOfMinits": 46,
        "date": "2022-10-13T12:45:00.000Z",
        "carId": 1
      },
      {
        "id": 11,
        "numberOfMinits": 54,
        "date": "2022-10-13T13:48:00.000Z",
        "carId": 1
      }
    ]
  },
  {...},
  ...
]
```
A megvalósítás: 
- async fügvénnyel
- A getTrips() promisszal tér vissza, így a visszatérési érték az await miatt a res függvény paramétere: results
```js
//A függvény egy promisszal tér vissza
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
```

# XSS védelem
[XSS támadás](https://www.cert.hu/cross-site-scripting-xss)

# Trips CRUD
- branch: 08_Trips_CRUD

## Date format
[date-format()](https://www.w3schools.com/sql/func_mysql_date_format.asp)
```sql
SELECT id, numberOfMinits, DATE_FORMAT(date, '%Y.%m.%d %h:%i:%s') date, carId from trips
  WHERE carId = 1;
```
# JWT token
branch: 12_jwt_autentikáció
- [Mi a jwt token](https://www.youtube.com/watch?v=7Q17ubqLfaM)
- [a jwt részei, tartalma](https://jwt.io/)

## JWT autentikáció
### Telepített modulok
- express: `npm i express`
- jwt: `npm i jsonwebtoken`
- .env fájl kezelés: titkos információk tárolása: `npm i dotenv`

### random hexa sztring létrehozása
Generálunk egy 64 bájtos véletlen hexa számot
```cmd
node
> require('crypto').randomBytes(64).toString('hex')
```

### .env fájl
- Itt tároljuk a "titkos" dolgokat, nem a kódban.
- A kódból ezt érjük el.

.env fájl
```env
ACCESS_TOKEN_SECRET = b7bc72b8788c983bf2b27441257b4feb3fd85d7cd0b432c87013dbd4dfeb3157317e7260e5a2542b5ba50d8c91a1d1bdf19de8d1b2c7b42b45cc11e981511d2a
REFRESH_TOKEN_SECRET = f345068c2975d477d6ad3964bec80330b99af59aee9106c37ec01a18c7be76154413b916abd984cf2eb46b3029de97408e74ada9a3285d33757db89c5daf6124
```

### A jwt autentikáció elve
1. A /login ágon megadjuk hogy kik vagyunk:
```json
{
    "username": "Jim"
}
```

2. Válaszképpen kapunk egy tokent:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSmltIiwiaWF0IjoxNjczODA1NDYxfQ.SM3mvSojMi_SXSeGEen1UZGhO-w0nlVJPlCHkg6lYPo"
}
```
    - A token titkosítva tartalmazza "Jim"-et

3. Amikor adatot kérünk le, ezt a tokent
    - az `Authorization` kulcs `Bearer` (tulajdonos) `token` érték párral átküldjük a fejlécben:
```js
get http://localhost:3000/posts
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSmltIiwiaWF0IjoxNjczODA1NDYxfQ.SM3mvSojMi_SXSeGEen1UZGhO-w0nlVJPlCHkg6lYPo

```
4. A szerver egy
    - authenticateToken() middlevare segítségével
    - kihámozza a user-t ("Jim") a tokenből és
    - berakja req.user kulcssal a req-ba
    - ha minden ok., akkor next()
    - ha nem ok, akkor nem lép tovább

5. Ha az authenticateToken() middleware továbbengedett
    - megvizsgáljuk, hogy a tokenből kihámozott user tényleg létezik-e
    - ha igen, akkor kiszolgáljuk a kérést
    - ha nem, akkor azt mondjuk, hogy nincs ilyen user

6. Összefoglalva (egyszerűsítve)
    - kapsz egy tokent, amiben benne vagy (user neved)
    - ha tokened-el kérsz valamit, megnézzük, hogy te regisztrálva vagy-e
    - ha igen kiszolgálunk,
    - ha nem akkor viszlát

7. Összefoglalva (valóságban)
    - kapsz egy időkorlátos access tokent amiben benne vagy, és egy refresh tokent
    - ha az access tokened-el kérsz valamit, megnézzük, hogy te regisztrálva vagy-e
    - ha igen kiszolgálunk,
    - ha nem akkor viszlát
    - ha lejárt az időkorlát, akkor nem szolgálunk ki
    - de a refresh tokeneddel kérhetsz új időkorlátos tokent
    - logout: A refresh tokeneddel lehet kilépni
    - Ettől kezdve már a tokenjeid érvénytelenné válnak.  

### A megvalósítás:
```js
//.env fájból tudunk olvasni a kulcsok alapján
require('dotenv').config();

const express = require('express')
const app = express()
//token készítés és ellenőrzés
const jwt = require('jsonwebtoken');

//Middleware: A kommunikációban json-t hasznáunk
app.use(express.json());

//Ezek a user-ek vannak regisztrálva
const posts = [
    {
        username: 'Kyle',
        tutle: 'post 1'
    },
    {
        username: 'Jim',
        tutle: 'post 2'
    }
]

app.get('/posts', authenticateToken, (req, res) => {
    // Ha regisztrálva vagy nálunk, akkor kapod amit kértél
    // A tokenben lévő usernév (ezt bányászta ki a middleware a tokenből)
    let usernameFromToken = req.user.name
    //Keresünk téged
    let post = posts.filter(post => post.username === usernameFromToken);
    if (post.length == 0) {
        //nem vagy meg
        res.json({error: `wrong user: ${usernameFromToken}`})
        return
    }
    //megvagy, vidd amit kértél
    res.json(post)
})

// Bejelenkezési útvonal
// Aki bejelnekezik, kap egy tokent
app.post('/login', (req, res) => {
    //Autencicate user
  const username = req.body.username;
  const user = {name: username};

  //jwt token létrehozása, amiben a user adatai tárolódtak 
  // az ACCESS_TOKEN_SECRET segítségével titkosítva
  //A tokent visszaküldjük annak, aki bejelentkezett 
  let accessToken =  jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
  res.json({accessToken: accessToken});
})

// Ez egy middleware, ami a tokenből kibányássza a user adatait
// és berakja a req.user kulcs alá
function authenticateToken(req, res, next){
    //A Beaber fejlécből kibányássza a tokent
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log(authHeader);
    
    //Ha nincs token, akkor nem megy tovább, és 401-es státuszt küld
    if (token == null) {
        return res.sendStatus(401);
    }

    //Megkapja a tokent, és a letárolt ACCESS_TOKEN_SECRET kulcs segítségével 
    // a user változóba kibányássza a user-t
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, user) => {
        if (error) {
            //A token szabálytalan
            return res.sendStatus(403);
        }
        // A user bekerül a req objektum user kulcsába
        req.user = user;
        console.log("user:", user);
        next();
    })
}

app.listen(3000)
```



## A hitelesítő szerver feladatai
A hitelesítő szerver: `serverAuth.js`
- külön porton működik: pl: 4000
- három feladata van
  1. login: a user nevére ad két tokent: accessToken (dőkorlátos: pl. 15 perc), refreshToken
  2. token: a refreshToken-el úk időkorlátos token adása
  3. logout: a refreshToken-el lehet kikejelentkezni

## Frissítési token értelme
Az nem jó megoldás, hogy a felhasználóink kapnak egy tokent, amit örökre használhatnak
A megoldás:
- A normál tokenek rövid lejáratúak: 10-15 perc
- Ha valaki megszerzi a tokenemet, az csak néhány percig használhatja
- A refresh tokeneket elmentjük egy biztonságos helyre
- Az új token beszerzéséhez a frissítési tokent kell használni
- A logout törli a frissítési tokeneket és a rabló már nem tud mit kezdeni az ellopott tokenekkel

## A működés
### login
1. A bejelenkezést a 4000-es porton az `serverAuth.js` kezeli a `post ... /login` rout-on
    
- login:
```js
### login
post http://localhost:4000/login
Content-Type: application/json

{
    "username": "Jim"
}
```

- Visszaad egy normál időkorlátos: `accessToken`, és egy frissítési: `refreshToken` korlátlan tokent az alábbi fomában: 
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSmltIiwiaWF0IjoxNjczODEwODI0LCJleHAiOjE2NzM4MTA4Mzl9.ZlfsROtE2cFdJy_u8lkXA8e_rwdDC3vu6XXwWdTAkl8",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSmltIiwiaWF0IjoxNjczODEwODI0fQ.GGXTzQ1M3k1GqKDAx6M8rRUfA0CcWoS4jr8rTY1M720"
}
```

A `refreshToken`-t a szerver egy tömbben (`refreshToken`) tárolja a kijelentkezésig. 

2. Az adatlekérés csak az időkorláton belül működik a normál tokennel
```json
### get posts egyik szerverről
get http://localhost:3000/posts
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSmltIiwiaWF0IjoxNjczODEwODI0LCJleHAiOjE2NzM4MTA4Mzl9.ZlfsROtE2cFdJy_u8lkXA8e_rwdDC3vu6XXwWdTAkl8

```
Megvalósítás: 
```js
app.post('/login', (req, res) => {
  const username = req.body.username;
  const user = {name: username};

  //Létrehozunk egy időkorlátos normál tokent
  let accessToken =  generateAccessToken(user);
  //és egy korlátlan idejű refresh tokent
  let refreshToken =  jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
  
  //tároljuk a refreshToken-t
  refreshTokens.push(refreshToken);

  //mindkét tokent odaadjuk a bejelentkezőnek
  res.json({accessToken: accessToken, refreshToken: refreshToken});
  console.log("accessToken /login:", accessToken);
  console.log("refreshToken /login:", refreshToken);
  console.log("refreshTokens /login:", refreshTokens);

})
```

### új accessToken (időkorlátos) token kérése
Amikor a felhasználónak lejárt az időkorlátja, `refreshToken`-jével kérhet újat a `post ... /token` rout-tal:
```json
post http://localhost:4000/token
Content-Type: application/json

{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSmltIiwiaWF0IjoxNjc1MzMwODc4fQ.SLWBQymlJGxXm9w91s3Z_7oLQyyHdUWpEBKfARg4qDg"
}
```

A válasz:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSmltIiwiaWF0IjoxNjczODEwODI0LCJleHAiOjE2NzM4MTA4Mzl9.ZlfsROtE2cFdJy_u8lkXA8e_rwdDC3vu6XXwWdTAkl8",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSmltIiwiaWF0IjoxNjczODEwODI0fQ.GGXTzQ1M3k1GqKDAx6M8rRUfA0CcWoS4jr8rTY1M720"
}
```

A megvalósítás: 
- A server megnézi, 
- hogy a refreshToken benne van-e a `refreshTokens` tömbben (ha nincs, vissza: 403)
- hogy a küldött `refreshToken` érvényes-e  (ha nem, vissza: 403)
- Ha érvényes, kibányássza belőle a user nevét (Jim)
- Ezzel a user névvel (Jim) generál egy újabb időkorlátos `accessToken`-t, amit visszaküld

```js
app.post('/token', (req, res) => {
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
        let accessToken =  generateAccessToken({name: user.name});

        //Átküldjük a tokent
        res.json({ accessToken: accessToken });

    });
    console.log("refreshTokens /token:", refreshTokens);
  });

```

### Logout
A server a user-nek elküldött `refreshToken` segítségével tudja kijelentkeztetni a felhasználót a `delete ... /logout` rout-on.

```json
delete http://localhost:4000/logout
Content-Type: application/json

{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSmltIiwiaWF0IjoxNjc1MzMwNTgxfQ.Js1gAAd2jvdTNAruhXCcVrxdpbzmORtfcvYYW6dPwME"
}
```

Vissza: 402

A megvalósítás:
- A `refreshTokens` tömbből kivesszük a küldött `refreshToken`-t
- Ez azt jelenti, hogy a user többé már nem tud a `refreshToken`-jével több időkorlátos `accessToken`-t kérni.

Megvalósítás: 
```js
  app.delete('/logout', (req, res) => {
    //eltüntetjük a refreshTokes-ből a küldött refreshToken-t
    refreshTokens = refreshTokens.filter(token => token !== req.body.token);
    res.sendStatus(402);
    console.log("refreshTokens /logout:", refreshTokens);
  });

```

### Logout all
A server a user-nek elküldött `refreshToken` segítségével tudja kijelentkeztetni az összes felhasználót a `delete ... /logoutall` rout-on.
- Innentől kezdve lehetetlenné válik refreshTokennel accessTokent kérni.
- Következmény: innentől mindenkinek újra be kell jelentkezni, nem lehet használni a refreshTokent
- Ennek szerviz céljai vannak, hogy ki lehessen üríteni a refreshTokens tömböt.
- Ezt élesben le kell tiltani.

Megvalósítás: 
```js
//Mindenkit kijelentkeztet (fejlesztési eszköz)
app.delete("/logoutall", (req, res) => {
  //eltüntetjük a refreshTokes-ből a küldött refreshToken-t
  refreshTokens = [];
  sendingInfo(res, 1, "Logout ok!", [], 402)
  console.log("refreshTokens /logoutall:", refreshTokens);
});
```



# Egyéb
## success kódok
success: 
  - 1: minden ok
  - 0: lekérdezés hiba
  - -3: Username and password are already taken (user név és email már létezik)
  - -2: Username are already taken (Ez a user név már létezik)
  - -1: Email are already taken (Ez az email név már létezik)

## Kód kezelés
Szegmonsek több szintű nyitása, csukása lehetővé teszik a kód átlátását.
- Ctrl-k-n, ahol n = 1,2,3,4,5,6,stb.
  - Fontos, hogy az a szegmens amiben állok, arra nincs hatással.
  - Ctrl-k-1: bezárja a regionokat
  - Ctrl-k-2: bezárja a regionokon belüli függvényeket
  - Ctrl-k-3: bezárja a függvényen belüli kódblok első szintjét
  - stb.
- Ctrl-k-j: kinyit mindent

