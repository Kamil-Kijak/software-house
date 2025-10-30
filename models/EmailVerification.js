
const { DataTypes } = require("sequelize");
const db = require("../utils/db");

const EmailVerification = db.define("EmailVerification", {
    email:{
        type:DataTypes.STRING(50),
        allowNull:false,
        primaryKey:true,
    },
    codeHash:{
        type:DataTypes.CHAR(60),
        allowNull:false
    },
    verified:{
        type:DataTypes.BOOLEAN,
        allowNull:false,
        defaultValue:false
    },
    expireDate:{
        type:DataTypes.DATE,
        allowNull:false
    }
},
{
    tableName:"emailVerifications",
    timestamps:false
});


module.exports = EmailVerification;