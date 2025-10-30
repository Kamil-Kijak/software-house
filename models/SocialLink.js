
const { DataTypes} = require("sequelize");
const db = require("../utils/db");
const { nanoid } = require("nanoid");
const User = require("./User");

const SocialLink = db.define("SocialLink", {
    ID:{
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
    ID_user:{
        type:DataTypes.CHAR(21),
        allowNull:false
    }
},
{
    tableName:"social_links",
    underscored:true,
    indexes:[
        {
            name:"idx_user",
            fields:["ID_user"]
        }
    ]
});

User.hasMany(SocialLink, {
    foreignKey:"ID_user",
    onDelete:"CASCADE",
    as:"socialLinks"
});
SocialLink.belongsTo(User, {
    foreignKey:"ID_user",
    onDelete:"CASCADE",
    as:"user"
});

module.exports = SocialLink;