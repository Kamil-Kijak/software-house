
const { DataTypes } = require("sequelize");
const db = require("../utils/db");
const { nanoid } = require("nanoid");
const User = require("./User");

const Subscription = db.define("Subscription", {
    id:{
        type:DataTypes.CHAR(21),
        allowNull:false,
        primaryKey:true,
        defaultValue:() => nanoid()
    },
    idUser:{
        type:DataTypes.CHAR(21),
        allowNull:false,
    },
    idSubscribed:{
        type:DataTypes.CHAR(21),
        allowNull:false,
    },
    notifications:{
        type:DataTypes.ENUM("all", "minimal", "none"),
        allowNull:false,
        defaultValue:"all"
    }
},
{
    tableName:"subscriptions",
    timestamps:false,
    indexes: [
        {
            name:"idx_user",
            fields: ["idUser"],
        },
        {
            name:"idx_subscribed",
            fields: ["idSubscribed"],
        }
    ],
});

User.hasMany(Subscription, {
    foreignKey: "idUser",
    as: "subscriptions",
    onDelete: "CASCADE",
});
User.hasMany(Subscription, {
    foreignKey: "idSubscribed",
    as: "subscribers",
    onDelete: "CASCADE",
});
Subscription.belongsTo(User, {
    foreignKey: "idUser",
    as: "subscriber",
});
Subscription.belongsTo(User, {
    foreignKey: "idSubscribed",
    as: "subscribed",
});


module.exports = Subscription;