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

# Lekérdezés
select * from cars;

# Adatbevitel
INSERT cars 
  (name, licenceNumber, hourlyRate)
  VALUES
  ('Mercedes', 'MM-111', 2000), ('Fiat', 'FF-111', 2100), ('BMW', 'BB-111', 2200);
