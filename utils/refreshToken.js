
const jwt = require("jsonwebtoken");

function createRefreshToken(res, payload) {
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_KEY || "inWhm0r9gfwJ_s07KEYrX", {expiresIn:"30d"});
    res.cookie("REFRESH_TOKEN", refreshToken, {
        maxAge:1000*60*60*24*30,
        httpOnly:true,
        secure:false
    });
}

module.exports = createRefreshToken;