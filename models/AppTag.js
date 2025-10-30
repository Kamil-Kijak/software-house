

const { DataTypes} = require("sequelize");
const db = require("../utils/db");
const { nanoid } = require("nanoid");
const Application = require("./Application");

const AppTag = db.define("AppTag", {
    ID:{
        type:DataTypes.CHAR(21),
        allowNull:false,
        primaryKey:true,
        defaultValue:() => nanoid()
    },
    name:{
        type:DataTypes.STRING(20),
        allowNull:false
    },
    ID_application:{
        type:DataTypes.CHAR(21),
        allowNull:false
    }
},
{
    tableName:"app_tags",
    underscored:true,
    indexes:[
        {
            name:"idx_application",
            fields:["ID_application"]
        }
    ]
});

Application.hasMany(AppTag, {
    foreignKey:"ID_application",
    onDelete:"CASCADE",
    as:"appTags"
});

AppTag.belongsTo(Application, {
    foreignKey:"ID_application",
    onDelete:"CASCADE",
    as:"application"
});

module.exports = AppTag;