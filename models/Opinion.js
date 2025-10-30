
const { DataTypes} = require("sequelize");
const db = require("../utils/db");
const { nanoid } = require("nanoid");
const Application = require("./Application");
const User = require("./User");

const Opinion = db.define("Opinion", {
    id:{
        type:DataTypes.CHAR(21),
        allowNull:false,
        primaryKey:true,
        defaultValue:() => nanoid()
    },
    idUser:{
        type:DataTypes.CHAR(21),
        allowNull:false
    },
    idApplication:{
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
    uploadDate:{
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
    timestamps:false,
    indexes:[
        {
            name:"idx_application",
            fields:["idApplication"]
        },
        {
            name:"idx_user",
            fields:["idUser"]
        }
    ]
});

Application.hasMany(Opinion, {
    foreignKey:"idApplication",
    onDelete:"CASCADE",
    as:"opinions"
});

User.hasMany(Opinion, {
    foreignKey:"idUser",
    onDelete:"CASCADE",
    as:"opinions"
});

Opinion.belongsTo(Application, {
    foreignKey:"idApplication",
    onDelete:"CASCADE",
    as:"application"
});

Opinion.belongsTo(User, {
    foreignKey:"idUser",
    onDelete:"CASCADE",
    as:"user"
});

module.exports = Opinion;