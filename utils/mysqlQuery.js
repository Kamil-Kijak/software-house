
const connection = require("./mysqlConnector");

async function sqlQuery(res, query, params) {
    try {
        const [result] = await connection.execute(query, params);
        return result;
    } catch (err) {
        res.status(500).json({error:"Mysql error", info:err.message});
        throw new Error("MYSQL ERROR: --> " + err);
    }
}

module.exports = sqlQuery;