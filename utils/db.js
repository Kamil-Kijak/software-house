const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(process.env.DB_NAME || "software_house_database", process.env.DB_USER || "root", process.env.DB_PASSWORD || "", {
    host:process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging:false
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Sequelize mysql connection succeed");
  } catch (error) {
    console.error("Sequelize mysql connection failed: ", error.message);
    process.exit(1);
  }
})();

module.exports = sequelize;