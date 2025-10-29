

const { DataTypes } = require("sequelize");
const db = require("../utils/db");
const { nanoid } = require("nanoid");
const User = require("./User")

const Notification = db.define("Notification", {
    ID: {
        type:DataTypes.CHAR(21),
        allowNull:false,
        primaryKey:true,
        defaultValue:() => nanoid()
    },
    send_date:{
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
    ID_user:{
        type:DataTypes.CHAR(21),
        allowNull:false
    }
},
{
    tableName:"notifications",
    underscored:true,
    indexes:[
        {
            name:"idx_user",
            fields:["ID_user"]
        }
    ]
});

User.hasMany(Notification, {
    foreignKey:"ID_user",
    as:"notifications",
    onDelete:"CASCADE"
});
Notification.belongsTo(User, {
    foreignKey:"ID_user",
    as:"user",
    onDelete:"CASCADE"
})

module.exports = Notification;