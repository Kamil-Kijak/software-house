

const { DataTypes } = require("sequelize");
const db = require("../utils/db");
const { nanoid } = require("nanoid");
const User = require("./User")

const Notification = db.define("Notification", {
    id: {
        type:DataTypes.CHAR(21),
        allowNull:false,
        primaryKey:true,
        defaultValue:() => nanoid()
    },
    sendDate:{
        type:DataTypes.DATE,
        allowNull:false
    },
    title:{
        type:DataTypes.STRING(75),
        allowNull:true
    },
    read:{
        type:DataTypes.BOOLEAN,
        allowNull:false,
        defaultValue:false
    },
    href:{
        type:DataTypes.STRING(255)
    },
    idUser:{
        type:DataTypes.CHAR(21),
        allowNull:false
    }
},
{
    tableName:"notifications",
    timestamps:false,
    indexes:[
        {
            name:"idx_user",
            fields:["idUser"]
        }
    ]
});

User.hasMany(Notification, {
    foreignKey:"idUser",
    as:"notifications",
    onDelete:"CASCADE"
});
Notification.belongsTo(User, {
    foreignKey:"idUser",
    as:"user",
    onDelete:"CASCADE"
})


module.exports = Notification;