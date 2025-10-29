
const { DataTypes } = require("sequelize");
const db = require("../utils/db");
const { nanoid } = require("nanoid");
const User = require("./User");

const Subscription = db.define("Subscription", {
    ID:{
        type:DataTypes.CHAR(21),
        allowNull:false,
        primaryKey:true,
        defaultValue:() => nanoid()
    },
    ID_user:{
        type:DataTypes.CHAR(21),
        allowNull:false,
    },
    ID_subscribed:{
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
    underscored:true,
    indexes: [
        {
            name:"idx_user",
            fields: ["ID_user"],
        },
        {
            name:"idx_subscribed",
            fields: ["ID_subcribed"],
        }
    ],
});

User.hasMany(Subscription, {
    foreignKey: "ID_user",
    as: "subscriptions",
    onDelete: "CASCADE",
});
User.hasMany(Subscription, {
    foreignKey: "ID_subscribed",
    as: "subscribers",
    onDelete: "CASCADE",
});
Subscription.belongsTo(User, {
    foreignKey: "ID_user",
    as: "subscriber",
});
Subscription.belongsTo(User, {
    foreignKey: "ID_subscribed",
    as: "subscribed",
});

module.exports = Subscription;