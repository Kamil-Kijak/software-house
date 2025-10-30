

const { DataTypes} = require("sequelize");
const db = require("../utils/db");
const { nanoid } = require("nanoid");
const Application = require("./Application");

const AppTag = db.define("AppTag", {
    id:{
        type:DataTypes.CHAR(21),
        allowNull:false,
        primaryKey:true,
        defaultValue:() => nanoid()
    },
    name:{
        type:DataTypes.STRING(20),
        allowNull:false
    },
    idApplication:{
        type:DataTypes.CHAR(21),
        allowNull:false
    }
},
{
    tableName:"appTags",
    timestamps:false,
    indexes:[
        {
            name:"idx_application",
            fields:["idApplication"]
        }
    ]
});

Application.hasMany(AppTag, {
    foreignKey:"idApplication",
    onDelete:"CASCADE",
    as:"appTags"
});

AppTag.belongsTo(Application, {
    foreignKey:"idApplication",
    onDelete:"CASCADE",
    as:"application"
});

module.exports = AppTag;