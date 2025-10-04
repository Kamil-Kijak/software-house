
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
CREATE DATABASE software_house_database;
USE software_house_database;


CREATE TABLE `users` (
	`ID` CHAR(21) NOT NULL PRIMARY KEY,
    `email` VARCHAR(50) UNIQUE NOT NULL,
    `username` VARCHAR(50) UNIQUE NOT NULL,
    `country` VARCHAR(50) NOT NULL,
    `password_hash` VARCHAR(60) NOT NULL,
    `double_verification` BOOLEAN NOT NULL DEFAULT 0,
    `profile_description` VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `subscriptions` (
	`ID` CHAR(21) NOT NULL PRIMARY KEY,
    `ID_user` CHAR(21) NOT NULL,
    `ID_subscribed` CHAR(21) NOT NULL,
    `notifications` ENUM("all", "minimal", "none") DEFAULT "all",
    INDEX idx_user (ID_user),
    INDEX idx_subscribed (ID_subscribed),
    FOREIGN KEY (`ID_user`) REFERENCES users(`ID`) ON DELETE CASCADE,
    FOREIGN KEY (`ID_subscribed`) REFERENCES users(`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `email_verifications` (
	`email` CHAR(50) NOT NULL PRIMARY KEY,
    `code_hash` VARCHAR(60) NOT NULL,
    `verified` BOOLEAN NOT NULL DEFAULT 0,
    `expire_date` CHAR(29) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `notifications` (
	`ID` CHAR(21) NOT NULL PRIMARY KEY,
    `send_date` CHAR(29) NOT NULL,
    `title` VARCHAR(75) NOT NULL,
    `read` BOOLEAN NOT NULL DEFAULT 0,
    `href` VARCHAR(255),
    `ID_user` CHAR(21) NOT NULL,
    INDEX idx_user (ID_user),
    FOREIGN KEY (`ID_user`) REFERENCES users(`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `applications` (
	`ID` CHAR(21) NOT NULL PRIMARY KEY,
    `name` VARCHAR(25) NOT NULL,
    `description` TEXT NOT NULL,
    `app_file` VARCHAR(35) NOT NULL,
    `update_date` CHAR(29) NOT NULL,
    `status` ENUM("release", "early-access", "beta-tests") NOT NULL DEFAULT "release",
    `ID_user` CHAR(21),
    INDEX idx_user (ID_user),
    FOREIGN KEY (`ID_user`) REFERENCES users(`ID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `app_tags` (
	`ID` CHAR(21) NOT NULL PRIMARY KEY,
    `name` VARCHAR(20) NOT NULL,
    `ID_application` CHAR(21) NOT NULL,
    INDEX idx_application (ID_application),
    FOREIGN KEY (`ID_application`) REFERENCES applications(`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `opinions` (
	`ID` CHAR(21) NOT NULL PRIMARY KEY,
    `ID_user` CHAR(21) NOT NULL,
    `ID_application` CHAR(21) NOT NULL,
    `rating` DECIMAL(2, 1) NOT NULL DEFAULT 5,
    `comment` TEXT DEFAULT NULL,
    INDEX idx_application (ID_application),
    INDEX idx_user (ID_user),
    FOREIGN KEY (`ID_user`) REFERENCES users(`ID`) ON DELETE CASCADE,
    FOREIGN KEY (`ID_application`) REFERENCES applications(`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `app_screens` (
	`ID` CHAR(21) NOT NULL PRIMARY KEY,
    `description` VARCHAR(25) DEFAULT NULL,
    `ID_application` CHAR(21) NOT NULL,
    INDEX idx_application (ID_application),
    FOREIGN KEY (`ID_application`) REFERENCES applications(`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `social_links` (
	`ID` CHAR(21) NOT NULL PRIMARY KEY,
    `name` VARCHAR(25) DEFAULT NULL,
    `href` VARCHAR(255) NOT NULL,
    `ID_user` CHAR(21) NOT NULL,
    INDEX idx_user (ID_user),
    FOREIGN KEY (`ID_user`) REFERENCES users(`ID`) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
