
const { DataTypes } = require("sequelize");
const db = require("../utils/db");

const EmailVerification = db.define("EmailVerification", {
    email:{
        type:DataTypes.STRING(50),
        allowNull:false,
        primaryKey:true,
    },
    code_hash:{
        type:DataTypes.CHAR(60),
        allowNull:false
    },
    verified:{
        type:DataTypes.BOOLEAN,
        allowNull:false,
        defaultValue:false
    },
    expire_date:{
        type:DataTypes.DATE,
        allowNull:false
    }
},
{
    tableName:"email_verifications",
    underscored:true,
});

module.exports = EmailVerification;