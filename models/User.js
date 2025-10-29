
const { DataTypes } = require("sequelize");
const db = require("../utils/db");


const User = db.define("User", {
    ID:{
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
    password_hash:{
        type:DataTypes.CHAR(60),
        allowNull:false
    },
    double_verification:{
        type:DataTypes.BOOLEAN,
        allowNull:false,
        defaultValue:false,
    },
    profile_description:{
        type:DataTypes.STRING(255),
        allowNull:true,
        defaultValue:null
    },
},
{
    tableName: "users",
    underscored: true
});

module.exports = User;