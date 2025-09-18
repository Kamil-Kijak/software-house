const checkBody = (requiredFields) => {
    return (req, res, next) => {
        if(req.body) {
            const missing = requiredFields.filter(field => req.body[field] == null);
            if(missing.length > 0) {
                return res.status(400).json({error:"missing body fields", missing:missing})
            } else {
                next();
            }
        } else {
            return res.status(400).json({error:"missing body object"})
        }
    }
}

module.exports = checkBody;