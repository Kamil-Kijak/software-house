
const { DataTypes } = require("sequelize");
const db = require("../utils/db");
const { nanoid } = require("nanoid");


const User = db.define("User", {
    id:{
        type:DataTypes.CHAR(21),
        primaryKey:true,
        allowNull:false,
        defaultValue: () => nanoid()
    },
    email:{
        type:DataTypes.STRING(50),
        unique:true,
        allowNull:false,
        validate:{
            isEmail:true
        }
    },
    username:{
        type:DataTypes.STRING(50),
        unique:true,
        allowNull:false
    },
    country:{
        type:DataTypes.STRING(50),
        allowNull:false
    },
    passwordHash:{
        type:DataTypes.CHAR(60),
        allowNull:false
    },
    doubleVerification:{
        type:DataTypes.BOOLEAN,
        allowNull:false,
        defaultValue:false,
    },
    profileDescription:{
        type:DataTypes.STRING(255),
        allowNull:true,
        defaultValue:null
    },
},
{
    tableName: "users",
    timestamps:false
});

module.exports = User;