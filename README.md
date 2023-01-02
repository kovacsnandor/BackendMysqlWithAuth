# Adatbázis létrehozás
- branch: `01_Adatbázis_Létrehozás`


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