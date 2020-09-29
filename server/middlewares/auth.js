const jwt = require('jsonwebtoken');
const User = require('../models/user/user');

module.exports = (req, res, next) => {
    const { authorization } = req.headers;

    //authorization === Bearer 665u56jykjmnytk
    if (!authorization) return res.status(401).json({ error: "You must be logged in" });

    const token = authorization.replace("Bearer ", "");

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) return res.status(401).json({ error: "You must be logged in!!" });
        const { _id } = payload;
        User.findById(_id).then(userId => {
            req.user = userId
            next();
        });
    });
}