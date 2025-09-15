
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
CREATE DATABASE software_house_database;
USE software_house_database;


CREATE TABLE `users` (
	`ID` CHAR(21) NOT NULL PRIMARY KEY,
    `email` VARCHAR(50) UNIQUE NOT NULL,
    `username` varchar(50) NOT NULL,
    `password_hash` varchar(60) NOT NULL,
    `remember_login` BOOLEAN NOT NULL DEFAULT 0,
    `profile_description` varchar(255)
) ENGINE=InnoDB;

CREATE TABLE `app_tags` (
	`ID` CHAR(21) NOT NULL PRIMARY KEY,
    `name` VARCHAR(20) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE `subscriptions` (
	`ID` CHAR(21) NOT NULL PRIMARY KEY,
    `ID_user` CHAR(21) NOT NULL,
    `ID_subscribed` CHAR(21) NOT NULL,
    `notifications` ENUM("all", "minimal", "none") DEFAULT "all",
    INDEX idx_user (ID_user),
    INDEX idx_subscribed (ID_subscribed),
    FOREIGN KEY (`ID_user`) REFERENCES users(`ID`) ON DELETE CASCADE,
    FOREIGN KEY (`ID_subscribed`) REFERENCES users(`ID`) ON DELETE CASCADE
) ENGINE=InnoDB;