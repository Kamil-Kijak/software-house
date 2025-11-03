
const { DataTypes} = require("sequelize");
const db = require("../utils/db");
const { nanoid } = require("nanoid");
const Application = require("./Application");

const AppScreen = db.define("AppScreen", {
    id:{
        type:DataTypes.CHAR(21),
        allowNull:false,
        primaryKey:true,
        defaultValue:() => nanoid()
    },
    description:{
        type:DataTypes.STRING(25),
        defaultValue:null
    },
    idApplication:{
        type:DataTypes.CHAR(21),
        allowNull:false
    }
},
{
    tableName:"appScreens",
    timestamps:false,
    indexes:[
        {
            name:"idx_application",
            fields:["idApplication"]
        }
    ]
});

Application.hasMany(AppScreen, {
    foreignKey:"idApplication",
    onDelete:"CASCADE",
    as:"appScreens"
});

AppScreen.belongsTo(Application, {
    foreignKey:"idApplication",
    onDelete:"CASCADE",
    as:"application"
});


module.exports = AppScreen;