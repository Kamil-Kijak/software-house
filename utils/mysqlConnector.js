

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host:process.env.DB_HOST || "localhost",
    user:process.env.DB_USER || "root",
    password:process.env.DB_PASSWORD || "",
    database:process.env.DB_NAME || "software_house_database"
});

const checkConnection = async () => {
    try {
        const connection = await pool.getConnection();
        await connection.ping()
        console.log("MySQL database connected successfully");
        connection.release
    } catch (err) {
        console.error("MySQL database connection failed ->", err.code);
        process.exit(1);
    }
}
checkConnection();

module.exports = pool;