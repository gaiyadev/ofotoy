const Admin = require('../../models/admin/admin');
const User = require('../../models/user/user');
const BookPhotography = require('../../models/user/book');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');

const transporter = nodemailer.createTransport(sgTransport({
    auth: {
        api_key: process.env.SENDGRID_API_KEY
    }
}));


/** ===============================================================================================
 * USER REGISTRATION TO THE SYSTEM
 * ================================================================================================= *
 */

exports.admin_registration = async (req, res) => {
    const { username, email, password, phone } = req.body;
    const schema = Joi.object({
        username: Joi.string().min(4).max(11).required(),
        email: Joi.string().min(5).max(255).required().email(),
        phone: Joi.string(),
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
    await Admin.findOne({ email: email }).then(user => {
        if (user) return res.status(400).json({ error: 'Admin already exist with the given email' });
        const newAdmin = new Admin({
            username: username,
            email: email,
            phone: phone,
            password: password,
        });
        Admin.createAdmin(newAdmin, (err, user) => {
            if (err) return err;
            // success login ... Generating jwt for auth
            jwt.sign({
                _id: user._id,
                email: user.email,
                username: user.username,
                phone: user.phone,
                userType: user.userType
            },
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
                            phone: user.phone,
                            userType: user.userType
                        },
                        message: "Account created successfully"
                    });
                });
        });
    }).catch(err => {
        console.log(err);
    });

}

/** ===============================================================================================
 * USER LOGIN TO THE SYSTEM
 * ================================================================================================= *
 */

exports.admin_login = async (req, res) => {
    const { phone, email, password } = req.body;
    const schema = Joi.object({
        password: Joi.string().min(6).max(255).required()
    });
    const { error } = schema.validate({
        password: password
    });

    if (error) {
        return res.status(400).json({
            error: error.details[0].message,
        });
    }
    await Admin.find().or([{ email: email }, { phone: phone }]).then(user => {
        if (!user) return res.status(400).json({ error: 'Invalid Username or Password.' });
        Admin.comparePassword(password, user[0]['password'], (err, isMatch) => {
            if (err) throw err;
            if (!isMatch) {
                return res.status(400).json({ error: "Invalid Username or Password." });
            } else {
                // success login ... Generating jwt for auth
                jwt.sign({
                    _id: user[0]['_id'],
                    email: user[0]['email'],
                    username: user[0]['username'],
                    phone: user[0]['phone'],
                    userType: user[0]['userType']
                },
                    process.env.JWT_SECRET,
                    {
                        expiresIn: 3600
                    }, (err, token) => {
                        if (err) throw err;
                        return res.json({
                            token,
                            user: {
                                _id: user[0]['_id'],
                                email: user[0]['email'],
                                username: user[0]['username'],
                                phone: user[0]['phone'],
                                userType: user[0]['userType']
                            },
                            message: "LogIn successfully"
                        });
                    });
            }
        })
    });
}

/** ===============================================================================================
 * USER CHANGE PASSWORD WHEN LOGIN TO THE SYSTEM
 * ================================================================================================= *
 */
exports.admin_change_password = async (req, res) => {
    const { password, newPassword } = req.body;
    const schema = Joi.object({
        password: Joi.string().min(6).max(255).required(),
        newPassword: Joi.string().min(6).max(255).required()
    });
    const { error } = schema.validate({
        password: password,
        newPassword: newPassword
    });

    if (error) {
        return res.status(400).json({
            error: error.details[0].message,
        });
    }
    await Admin.findOne({ _id: req.params.id })
        .then(user => {
            if (!user) {
                return res.status(400).json({
                    error: "User doesn't exist"
                });
            }
            bcrypt.hash(newPassword, 10).then(hashPassword => {
                user.password = hashPassword;
                user.save().then(saveUser => {
                    return res.json({
                        message: "Password changed successfully",
                        saveUser,
                    });
                })
            });
        }).catch(err => console.log(err));
}

/** ===============================================================================================
 * USER FORGOT PASSWORD LINK TO BE SEND
 * ================================================================================================= *
 */
exports.admin_reset_password = async (req, res) => {
    await crypto.randomBytes(32, (err, buffer) => {
        if (err) throw err;
        const token = buffer.toString('hex');
        Admin.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    return res.status(400).json({
                        error: 'No user is associated with this email'
                    });
                }
                user.resetToken = token;
                user.expiresToken = Date.now() + 360000;
                user.save().then(() => {
                    transporter.sendMail({
                        to: user.email,
                        from: 'isukue@gmail.com',
                        subject: 'Password reset',
                        html: `<p>
                                  You request for password reset
                                  <h5>click this < href="http://localhost:5000/reset/${token}">link</a> to reset your password</h5>
                        </p>`
                    })
                    return res.json({
                        message: "Check your mail for link to reset your password",
                    });
                })
            })
            .catch(err => console.log(err));
    })
}


/** ===============================================================================================
 * USER UPDATE PASSWORD FROM THE LINK SENT
 * ================================================================================================= *
 */
exports.new_password = async (req, res) => {
    const newPassword = req.body.password;
    const sentToken = req.body.token;
    await Admin.findOne({ resetToken: sentToken, expiresToken: { $gt: Date.now() } })
        .then(user => {
            if (!user) {
                return res.status(403).json({
                    error: "Try again. session expired"
                });
            }
            bcrypt.hash(newPassword, 10).then(hashPassword => {
                user.password = hashPassword;
                user.resetToken = undefined;
                user.expiresToken = undefined;
                user.save().then(saveUser => {
                    return res.json({
                        message: "Password changed successfully",
                        saveUser
                    });
                })
            });
        }).catch(err => console.log(err));

}


/** ===============================================================================================
 * FETCH ALL BOOKINGS
 * ================================================================================================= *
 */

exports.all_booking = async (req, res) => {
    await BookPhotography.find().then(book => {
        if (!book) return res.json({ message: "Booking not found" });
        return res.json({
            book
        });
    }).catch(() => {
        return res.json({
            error: "Booking not found",
        });
    })
}

/** ===============================================================================================
 * FETCH ALL USERS
 * ================================================================================================= *
 */

exports.all_users = async (req, res) => {
    await User.find({ userType: "User" }).select('-password').then(user => {
        if (!user) return res.json({ message: "Booking not found" });
        return res.json({
            user
        });
    }).catch(() => {
        return res.json({
            error: "User not found",
        });
    });
}

/** ===============================================================================================
 * FETCH ALL PHOTOGRAPHER
 * ================================================================================================= *
 */

exports.all_photographer = async (req, res) => {
    await User.find({ userType: "Photographer" }).select('-password').then(photographer => {
        if (!photographer) return res.json({ message: "Booking not found" });
        return res.json({
            photographer
        });
    }).catch(() => {
        return res.json({
            error: "photographer not found",
        });
    });
}