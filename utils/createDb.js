
const mysql = require('mysql2/promise');

const createDb = async () => {
    const connection = await mysql.createConnection({ host: process.env.DB_HOST || "localhost", user: process.env.DB_USER || "root", password: process.env.DB_PASSWORD || "" });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || "software_house_database"}\`;`);
    await connection.end();
}

module.exports = createDb;