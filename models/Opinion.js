
const { DataTypes} = require("sequelize");
const db = require("../utils/db");
const { nanoid } = require("nanoid");
const Application = require("./Application");
const User = require("./User");

const Opinion = db.define("Opinion", {
    ID:{
        type:DataTypes.CHAR(21),
        allowNull:false,
        primaryKey:true,
        defaultValue:() => nanoid()
    },
    ID_user:{
        type:DataTypes.CHAR(21),
        allowNull:false
    },
    ID_application:{
        type:DataTypes.CHAR(21),
        allowNull:false
    },
    rating:{
        type:DataTypes.INTEGER,
        allowNull:false,
        defaultValue:5,
        validate:{
            min:1,
            max:5
        }
    },
    upload_date:{
        type:DataTypes.DATE,
        allowNull:false
    },
    edited:{
        type:DataTypes.BOOLEAN,
        allowNull:false,
        defaultValue:false
    },
    comment:{
        type:DataTypes.TEXT,
        defaultValue:null
    }
},
{
    tableName:"opinions",
    underscored:true,
    indexes:[
        {
            name:"idx_application",
            fields:["ID_application"]
        },
        {
            name:"idx_user",
            fields:["ID_user"]
        }
    ]
});

Application.hasMany(Opinion, {
    foreignKey:"ID_application",
    onDelete:"CASCADE",
    as:"opinions"
});

User.hasMany(Opinion, {
    foreignKey:"ID_user",
    onDelete:"CASCADE",
    as:"opinions"
});

Opinion.belongsTo(Application, {
    foreignKey:"ID_application",
    onDelete:"CASCADE",
    as:"application"
});

Opinion.belongsTo(User, {
    foreignKey:"ID_user",
    onDelete:"CASCADE",
    as:"user"
});

module.exports = Opinion;