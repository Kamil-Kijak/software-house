
const { DataTypes} = require("sequelize");
const db = require("../utils/db");
const { nanoid } = require("nanoid");
const Application = require("./Application");

const AppScreen = db.define("AppScreen", {
    ID:{
        type:DataTypes.CHAR(21),
        allowNull:false,
        primaryKey:true,
        defaultValue:() => nanoid()
    },
    description:{
        type:DataTypes.STRING(25),
        defaultValue:null
    },
    ID_application:{
        type:DataTypes.CHAR(21),
        allowNull:false
    }
},
{
    tableName:"app_screens",
    underscored:true,
    indexes:[
        {
            name:"idx_application",
            fields:["ID_application"]
        }
    ]
});

Application.hasMany(AppScreen, {
    foreignKey:"ID_application",
    onDelete:"CASDADE",
    as:"appScreens"
});

AppScreen.belongsTo(Application, {
    foreignKey:"ID_application",
    onDelete:"CASDADE",
    as:"application"
});

module.exports = AppScreen;