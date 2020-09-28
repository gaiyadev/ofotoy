const User = require('../models/user');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

/** 
 * USER REGISTRATION
 */

exports.user_registration = async (req, res) => {
    const { username, email, phone, password } = req.body;

    const schema = Joi.object({
        username: Joi.string().min(4).max(11).required(),
        email: Joi.string().min(5).max(255).required().email(),
        phone: Joi.required(),
        password: Joi.string().min(6).max(255).required()
    });
    const { error } = schema.validate({
        username: username,
        email: email,
        phone: phone,
        password: password
    });
    if (error) {
        return res.status(400).json({
            error: error.details[0].message,
        });
    }
    await User.findOne({ phone: phone }).then(user => {
        if (user) return res.status(400).json({ error: 'User already exist' });
        const newUser = new User({
            username: username,
            email: email,
            phone: phone,
            password: password,
        });
        User.newUser(newUser, (err, user) => {
            if (err) return err;
            return res.json({
                success: true,
                message: "Account created successfully",
                user: {
                    username: user.username,
                    phone: user.phone,
                    email: user.email
                }
            });
        });
    }).catch(err => {
        console.log(err);
    });

}

/**
 * Login a user
 * @param {*} req 
 * @param {*} res 
 */

exports.user_login = async (req, res) => {
    const { phone, password } = req.body;
    const schema = Joi.object({
        phone: Joi.required(),
        password: Joi.string().min(6).max(255).required()
    });
    const { error } = schema.validate({
        phone: phone,
        password: password
    });

    if (error) {
        return res.status(400).json({
            error: error.details[0].message,
        });
    }
    await User.findOne({ phone: phone }).then(user => {
        if (!user) return res.status(400).json({ error: 'Mobile Number or password is invalid' });
        User.comparePassword(password, user.password, (err, isMatch) => {
            if (err) throw err;
            if (!isMatch) {
                return res.status(400).json({ error: "Mobile Number or Password is invalid" });
            } else {
                // success login ... Generating jwt for auth
                jwt.sign({ _id: user._id, email: user.email, username: user.username, phone: user.phone },
                    process.env.JWT_SECRET,
                    {
                        expiresIn: 3600
                    }, (err, token) => {
                        if (err) throw err;
                        return res.json({
                            token,
                            user: {
                                _id: user._id,
                                email: user.email,
                                username: user.username,
                                phone: user.phone
                            },
                            message: "LogIn successfully"
                        });
                    });
            }
        })
    });
}