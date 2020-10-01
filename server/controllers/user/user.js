const User = require('../../models/user/user');
const BookPhotography = require('../../models/user/book');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');
const multer = require('multer');
const fs = require("fs");

const transporter = nodemailer.createTransport(sgTransport({
    auth: {
        api_key: process.env.SENDGRID_API_KEY
    }
}));

/** ===============================================================================================
 * USER REGISTRATION TO THE SYSTEM
 * ================================================================================================= *
 */
exports.user_registration = async (req, res) => {
    const { username, email, phone, password } = req.body;
    const schema = Joi.object({
        username: Joi.string().min(4).max(11).required(),
        email: Joi.string().min(5).max(255).required().email(),
        phone: Joi.string().max(255).required(),
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
    await User.findOne({ email: email }).then(user => {
        if (user) return res.status(400).json({ error: 'User already exist with the given email' });
        const newUser = new User({
            username: username,
            email: email,
            phone: phone,
            password: password,
        });
        User.newUser(newUser, (err, user) => {
            if (err) return err;
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
exports.user_login = async (req, res) => {
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
    await User.find().or([{ email: email }, { phone: phone }]).then(user => {
        if (!user) return res.status(400).json({ error: 'Username or password is invalid' });
        User.comparePassword(password, user[0]['password'], (err, isMatch) => {
            if (err) throw err;
            if (!isMatch) {
                return res.status(400).json({ error: "Mobile Number or Password is invalid" });
            } else {
                // success login ... Generating jwt for auth
                jwt.sign({ _id: user[0]['_id'], email: user[0]['email'], username: user[0]['username'], phone: user[0]['phone'] },
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
                                phone: user[0]['phone']
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
exports.user_change_password = async (req, res) => {
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
    await User.findOne({ _id: req.params.id })
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
exports.user_reset_password = async (req, res) => {
    await crypto.randomBytes(32, (err, buffer) => {
        if (err) throw err;
        const token = buffer.toString('hex');
        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    return res.status(400).json({
                        error: 'No user is associated with this email'
                    });
                }
                user.resetToken = token;
                user.expiresToken = Date.now() + 360000;
                user.save().then(result => {
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
    await User.findOne({ resetToken: sentToken, expiresToken: { $gt: Date.now() } })
        .then(user => {
            if (!user) {
                return res.status(403).json({
                    error: "Try again. session ezpired"
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
 * USER COMPLETE REGISTRATION TO THE SYSTEM WHEN LOGIN
 * ================================================================================================= *
 */
// file upload code

const storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, './public/uploads/')
    },
    limits: {
        fileSize: 5000000
    },
    filename: function (req, file, cb) {
        let datetimestamp = Date.now();
        let pic = file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1];
        cb(null, pic);
    },
    fileFilter: (req, file, cb) => {
        // allow images only
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            console.log('Only image are allowed.');
        }
        cb(null, true);
    },
});

const uploadSingle = multer({
    storage: storage
}).single('profile_image');

exports.complete_user_registration = async (req, res) => {
    const { dob, fullName, location } = req.body;
    const id = req.params.userId;
    const schema = Joi.object({
        dob: Joi.required(),
        fullName: Joi.string().min(4).max(255).required(),
        location: Joi.string().required(),
    });
    const { error } = schema.validate({
        dob: dob,
        fullName: fullName,
        location: location,
        // profile_image: pic
    });
    if (error) {
        return res.status(400).json({
            error: error.details[0].message,
        });
    }
    uploadSingle(req, res, (err) => {
        if (err) return res.json.status(400)({ error_code: 1, err_desc: err });
        res.json(req.file);
    });
    await User.findByIdAndUpdate(id).then(user => {
        if (!user) {
            return res.status(400).json({
                error: "User not found",
            });
        }
        user.dob = dob;
        user.location = location;
        user.fullName = fullName
        user.save();
        return res.json({
            message: "Regitration completed successfully",
            user
        });
    }).catch(err => {
        return res.status(400).json({
            error: err,
        });
    })
}

/** ===============================================================================================
 * BOOK FOR A PHOTOGRAPHY SESSION
 * ================================================================================================= *
 */
exports.book_photographer = async (req, res) => {
    const userId = req.params.userId;
    // const photographerBooked;
    const { email, phone, fullName, location } = req.user;
    const { time } = req.body;
    const schema = Joi.object({
        time: Joi.string().required(),
    });
    const { error } = schema.validate({
        time: time,
    });
    if (error) {
        return res.status(400).json({
            error: error.details[0].message,
        });
    }
    //
    await User.findOne({ _id: userId }).then(user => {
        if (!user) {
            return res.status(400).json({
                error: "User not found",
            });
        }
        const newBook = new BookPhotography({
            email: email,
            phone: phone,
            fullName: fullName,
            time: time,
            location: location,
            bookedBy: userId,
            // photographerBooked: photographerBooked
        });
        BookPhotography.BookPhotography(newBook, (err, book) => {
            if (err) return err;
            return res.status(200).json({
                status: "Book sucessfully ",
                book
            });

        });
    }).catch(err => {
        return res.status(400).json({
            error: err,
        });
    });
}

/** ===============================================================================================
 * USER UPDATE PROFILE
 * ================================================================================================= *
 */
exports.update_user_profile = async (req, res) => {
    const { dob, fullName, location } = req.body;
    const id = req.params.userId;
    const schema = Joi.object({
        dob: Joi.required(),
        fullName: Joi.string().min(4).max(255).required(),
        location: Joi.string().required(),
    });
    const { error } = schema.validate({
        dob: dob,
        fullName: fullName,
        location: location,
        // profile_image: pic
    });
    if (error) {
        return res.status(400).json({
            error: error.details[0].message,
        });
    }
    // uploadSingle(req, res, (err) => {
    //     if (err) return res.json.status(400)({ error_code: 1, err_desc: err });
    //     res.json(req.file);
    // });
    await User.findByIdAndUpdate(id).then(user => {
        if (!user) {
            return res.status(400).json({
                error: "User not found",
            });
        }
        user.dob = dob;
        user.location = location;
        user.fullName = fullName
        user.save();
        return res.json({
            message: "Profile updated successfully",
            user
        });
    }).catch(err => {
        return res.status(400).json({
            error: err,
        });
    })
}

//TODO
// 1. Booking not yet complete
//2. Payment gateway integrstion
// 3. profile pics (bug)
//4. follow/ unfollow
//5 Tag


/** ===============================================================================================
 * VIEW BOOKINGS BY A SINGLE USER
 * ================================================================================================= *
 */
exports.fetch_user_booking = async (req, res) => {
    const userId = req.params.userId;
    await BookPhotography.findOne({ bookedBy: userId }).then(book => {
        if (!book) return res.status(400).json({ message: "No booking found" });
        return res.json({
            status: true,
            book
        });
    }).catch(err => {
        return res.json({
            error: err,
        });
    });
}

/** ===============================================================================================
 * DELETE BOOKINGS BY A SINGLE USER
 * ================================================================================================= *
 */

exports.delete_user_booking = async (req, res) => {
    const userId = req.params.userId;
    await BookPhotography.findOneAndDelete({ bookedBy: userId }).then(booking => {
        if (!booking) {
            return res.json({
                message: "Booking not found",
            });
        }
        return res.json({
            message: "Booking deleted successfully",
            booking
        });
    }).catch(err => {
        return res.json({
            message: "Booking not found",
            error: err,
        });
    })
}

/** ===============================================================================================
 * UPDATE BOOKINGS BY A SINGLE USER
 * ================================================================================================= *
 */
exports.update_user_booking = async (req, res) => {
    const userId = req.params.userId;
    const { time } = req.body;

    const schema = Joi.object({
        time: Joi.string().required(),
    });
    const { error } = schema.validate({
        time: time,
    });
    if (error) {
        return res.status(400).json({
            error: error.details[0].message,
        });
    }
    //
    await BookPhotography.findOneAndUpdate({ bookedBy: userId }).then(booking => {
        if (!booking) {
            return res.status(400).json({
                error: "Booking not found",
            });
        }
        booking.time = time;
        booking.save();
        return res.json({
            message: "Booking updated successfully",
            booking
        });
    }).catch(err => {
        return res.status(400).json({
            error: err,
        });
    })
}

/** ===============================================================================================
 * FETCH ALL BOOKINGS BY A SINGLE USER
 * ================================================================================================= *
 */

exports.fetch_all_user_booking = async (req, res) => {
    const userId = req.params.userId;
    await BookPhotography.find({ bookedBy: userId }).then(book => {
        return res.status(200).json({
            book: book,
        });
    }).catch(err => {
        return res.status(400).json({
            error: err,
            error: "err"
        });
    });
}

/** ===============================================================================================
 * USER FOLLOW A USER
 * ================================================================================================= *
 */
exports.follow_user = async (req, res) => {
    await User.findByIdAndUpdate(req.body.followId, {
        $push: { followers: req.user._id }
    }, {
        new: true
    }, (err) => {
        if (err) return res.status(400).json({ error: err });
        //else
        User.findByIdAndUpdate(req.user._id, {
            $push: { following: req.body.followId }
        }, {
            new: true
        }).select("-password")
            .then(result => {
                return res.json({ result });
            }).catch(err => {
                return res.status(400).json({ error: err });
            });
    });
}

/** ===============================================================================================
 * USER UNFOLLOW A USER
 * ================================================================================================= *
 */

exports.unFollow_user = (req, res) => {
    User.findByIdAndUpdate(req.body.unfollowId, {
        $push: { followers: req.user._id }
    }, {
        new: true
    }, (err, result) => {
        if (err) {
            return res.status(422).json({ error: err })
        }
        User.findByIdAndUpdate(req.user._id, {
            $pull: { following: req.body.unfollowId }
        }, {
            new: true
        }).select("-password")
            .then(result => {
                return res.json({
                    result
                });
            }).catch(err => {
                return res.status(422).json({ error: err })
            })
    })
}


/** ===============================================================================================
 * VIEW OTHER USERS PROFILE
 * ================================================================================================= *
 */

exports.view_other_users_profile = async (req, res) => {
    const id = req.params.userId;
    await User.findOne({ _id: id }).select("-password")
        .then(user => {
            BookPhotography.find({ bookedBy: id }).populate("bookedBy", "_id username")
                .exec((err, posts) => {
                    if (err) {
                        return res.status(400).json({
                            error: err
                        });
                    }
                    return res.status(200).json({
                        user,
                        posts
                    });
                })

        }).catch(err => {
            return res.status(404).json({
                error: 'User not found',
            })
        })
}