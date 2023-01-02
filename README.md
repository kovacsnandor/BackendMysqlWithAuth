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
