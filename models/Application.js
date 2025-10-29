
const { DataTypes } = require("sequelize");
const db = require("../utils/db");
const { nanoid } = require("nanoid");
const User = require("./User");

const Application = db.define("Application", {
    ID:{
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
    app_file:{
        type:DataTypes.STRING(35),
        defaultValue:null
    },
    update_date:{
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
    ID_user:{
        type:DataTypes.CHAR(21),
    }
},
{
    tableName:"application",
    underscored:true,
    indexes:[
        {
            name:"idx_user",
            fields:["ID_user"]
        }
    ]
});

User.hasMany(Application, {
    foreignKey:"ID_user",
    onDelete:"SET NULL",
    as:"applications"
});
Application.belongsTo(User, {
    foreignKey:"ID_user",
    onDelete:"SET NULL",
    as:"user"
});

module.exports = Application;