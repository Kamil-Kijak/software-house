
const { DataTypes } = require("sequelize");
const db = require("../utils/db");
const { nanoid } = require("nanoid");
const User = require("./User");

const Application = db.define("Application", {
    id:{
        type:DataTypes.CHAR(21),
        primaryKey:true,
        allowNull:false,
        defaultValue:() => nanoid()
    },
    name:{
        type:DataTypes.STRING(25),
        allowNull:false
    },
    description:{
        type:DataTypes.TEXT,
        allowNull:false
    },
    appFile:{
        type:DataTypes.STRING(35),
        defaultValue:null
    },
    updateDate:{
        type:DataTypes.DATE,
        allowNull:false
    },
    status:{
        type:DataTypes.ENUM("release", "early-access", "beta-tests"),
        allowNull:false,
        defaultValue:"release"
    },
    public:{
        type:DataTypes.BOOLEAN,
        allowNull:false,
        defaultValue:false
    },
    downloads:{
        type:DataTypes.INTEGER,
        allowNull:false,
        defaultValue:0
    },
    idUser:{
        type:DataTypes.CHAR(21),
    }
},
{
    tableName:"applications",
    timestamps:false,
    indexes:[
        {
            name:"idx_user",
            fields:["idUser"]
        }
    ]
});

User.hasMany(Application, {
    foreignKey:"idUser",
    onDelete:"SET NULL",
    as:"applications"
});
Application.belongsTo(User, {
    foreignKey:"idUser",
    onDelete:"SET NULL",
    as:"user"
});


module.exports = Application;