const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(process.env.DB_NAME || "software_house_database", process.env.DB_USER || "root", process.env.DB_PASSWORD || "", {
    host:process.env.DB_HOST || "localhost",
    dialect: "mysql"
});

module.exports = sequelize;