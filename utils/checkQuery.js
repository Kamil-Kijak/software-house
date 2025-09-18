const checkQuery = (requiredFields) => {
    return (req, res, next) => {
        if(req.query) {
            const missing = requiredFields.filter(field => req.query[field] == null);
            if(missing.length > 0) {
                return res.status(400).json({error:"missing query fields", missing:missing})
            } else {
                next();
            }
        } else {
            return res.status(400).json({error:"missing query object"})
        }
    }
}

module.exports = checkQuery;