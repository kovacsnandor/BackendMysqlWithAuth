# Adatbázis létrehozás
- branch: 01_Adatbázis_Létrehozás


# Server létrehozás
- branch: 02_Express_Server

## Fájlok, szerkezet kialakítása
- Server: `server/index.js`
- Kliens helye: `server/views`
- Statikus fájlok helye: `server/public`

## package json
- Átlépés a server mappába: `cd server`
- package.json telepítése: `npm init`

## Letöltendő modulok
- nodemon (ha még nincs letöltve): `npm i -g nodemon`
- [express](https://www.npmjs.com/package/express): `npm i express`
- [mysql](https://www.npmjs.com/package/mysql): `mpm i mysql`

## dev script megírása (package.json)
```json
"scripts": {
    "dev": "nodemon --legacy-watch index.js"
  },
```

## Projekt indítása
1. Belépés a server mappába: `cd server`
2. Szerver indítása: `npm run dev`

# Csatlakozás az adatbázishoz
- branch: 03_Connect_Mysql

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
[A 10 leggyakoribb támadástípus](https://owasp.org/www-project-top-ten/)
