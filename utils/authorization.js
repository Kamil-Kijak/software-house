
const jwt = require("jsonwebtoken");

function authorization() {

    function createAccessToken(req, res, next) {
        try {
            const {iat, exp, nbf, ...payload} = jwt.verify(req.cookies["REFRESH_TOKEN"], process.env.REFRESH_TOKEN_KEY || "DD56yu89iu5T512HM56HGA1");
            const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_KEY || "DTFxS1341Pt4dS6yTnm7o9", {
                expiresIn:"10m"
            })
            res.cookie("ACCESS_TOKEN", accessToken, {
                maxAge:1000*60*10,
                httpOnly:true,
                secure:false
            });
            req.session = payload;
            next();
        } catch(e) {
            res.status(401).json({error:"Access denied, unauthorized", unauthorized:true});
        }
    }

    function auth(req, res, next) {
        if(req.cookies["REFRESH_TOKEN"]) {
            if(req.cookies["ACCESS_TOKEN"]) {
                try {
                    const {iat, exp, nbf, ...payload} = jwt.verify(req.cookies["ACCESS_TOKEN"], process.env.ACCESS_TOKEN_KEY || "DTFxS1341Pt4dS6yTnm7o9");
                    req.session = payload;
                    next();
                } catch(e) {
                    createAccessToken(req, res, next);
                }
            } else {
                createAccessToken(req, res, next);
            }
        } else {
            res.status(401).json({error:"Access denied, unauthorized", unauthorized:true});
        }
    }
    return auth;

}

module.exports = authorization;