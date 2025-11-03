
const { DataTypes} = require("sequelize");
const db = require("../utils/db");
const { nanoid } = require("nanoid");
const User = require("./User");

const SocialLink = db.define("SocialLink", {
    id:{
        type:DataTypes.CHAR(21),
        allowNull:false,
        primaryKey:true,
        defaultValue:() => nanoid()
    },
    name:{
        type:DataTypes.STRING(25),
        defaultValue:null
    },
    href:{
        type:DataTypes.STRING(255),
        allowNull:false
    },
    idUser:{
        type:DataTypes.CHAR(21),
        allowNull:false
    }
},
{
    tableName:"socialLinks",
    timestamps:false,
    indexes:[
        {
            name:"idx_user",
            fields:["idUser"]
        }
    ]
});

User.hasMany(SocialLink, {
    foreignKey:"idUser",
    onDelete:"CASCADE",
    as:"socialLinks"
});
SocialLink.belongsTo(User, {
    foreignKey:"idUser",
    onDelete:"CASCADE",
    as:"user"
});

module.exports = SocialLink;