const Photographer = require('../../models/photographer/photographer');
const Post = require('../../models/photographer/post');
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
 * PHOTOGRAPHER REGISTRATION TO THE SYSTEM
 * ================================================================================================= *
 */
exports.photographer_registration = async (req, res) => {
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
    await Photographer.findOne({ email: email }).then(photographer => {
        if (photographer) return res.status(400).json({ error: 'Photographer already exist with the given email' });
        const newPhotographer = new Photographer({
            username: username,
            email: email,
            phone: phone,
            password: password,
        });
        Photographer.newPhotographer(newPhotographer, (err, photographer) => {
            if (err) return err;
            // success login ... Generating jwt for auth
            jwt.sign({ _id: photographer._id, email: photographer.email, username: photographer.username, phone: photographer.phone },
                process.env.JWT_SECRET,
                {
                    expiresIn: 3600
                }, (err, token) => {
                    if (err) throw err;
                    return res.json({
                        token,
                        photographer: {
                            _id: photographer._id,
                            email: photographer.email,
                            username: photographer.username,
                            phone: photographer.phone
                        },
                        message: "Account created successfully"
                    });
                });
            transporter.sendMail({
                to: newUser.email,
                from: 'isukue@gmail.com',
                subject: 'Account created succesfully',
                html: `<p>
              You account has being created successfully..(ofotoy)
             </p>`
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
exports.photographer_login = async (req, res) => {
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
    await Photographer.find().or([{ email: email }, { phone: phone }]).then(photographer => {
        if (!photographer) return res.status(400).json({ error: 'Username or password is invalid' });
        Photographer.comparePassword(password, photographer[0]['password'], (err, isMatch) => {
            if (err) throw err;
            if (!isMatch) {
                return res.status(400).json({ error: "Mobile Number or Password is invalid" });
            } else {
                // success login ... Generating jwt for auth
                jwt.sign({ _id: photographer[0]['_id'], email: photographer[0]['email'], username: photographer[0]['username'], phone: photographer[0]['phone'] },
                    process.env.JWT_SECRET,
                    {
                        expiresIn: 3600
                    }, (err, token) => {
                        if (err) throw err;
                        return res.json({
                            token,
                            photographer: {
                                _id: photographer[0]['_id'],
                                email: photographer[0]['email'],
                                username: photographer[0]['username'],
                                phone: photographer[0]['phone']
                            },
                            message: "LogIn successfully"
                        });
                    });
            }
        })
    });
}

/** ===============================================================================================
 * PHOTOGRAPHER CHANGE PASSWORD WHEN LOGIN TO THE SYSTEM
 * ================================================================================================= *
 */
exports.photographer_change_password = async (req, res) => {
    const { password } = req.body;
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
    const newPassword = req.body.password;
    await Photographer.findOne({ _id: req.params.id })
        .then(photographer => {
            if (!photographer) {
                return res.status(422).json({
                    error: "User doesn't exist"
                });
            }
            bcrypt.hash(newPassword, 10).then(hashPassword => {
                photographer.password = hashPassword;
                photographer.save().then(savePhotographer => {
                    return res.json({
                        message: "Password changed successfully",
                        savePhotographer,
                    });
                })
            });
        }).catch(err => console.log(err));
}


/** ===============================================================================================
 * PHOTOGRAPHER FORGOT PASSWORD LINK TO BE SEND
 * ================================================================================================= *
 */
exports.photographer_reset_password = async (req, res) => {
    await crypto.randomBytes(32, (err, buffer) => {
        if (err) throw err;
        const token = buffer.toString('hex');
        Photographer.findOne({ email: req.body.email })
            .then(photographer => {
                if (!photographer) {
                    return res.status(400).json({
                        error: 'No photographer is associated with this email'
                    });
                }
                photographer.resetToken = token;
                photographer.expiresToken = Date.now() + 360000;
                photographer.save().then(result => {
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
 * PHOTOGRAPHER UPDATE PASSWORD FROM THE LINK SENT
 * ================================================================================================= *
 */
exports.photographer_new_password = (req, res) => {
    const newPassword = req.body.password;
    const sentToken = req.body.token;
    Photographer.findOne({ resetToken: sentToken, expiresToken: { $gt: Date.now() } })
        .then(photographer => {
            if (!photographer) {
                return res.status(403).json({
                    error: "Try again. session ezpired"
                });
            }
            bcrypt.hash(newPassword, 10).then(hashPassword => {
                photographer.password = hashPassword;
                photographer.resetToken = undefined;
                photographer.expiresToken = undefined;
                photographer.save().then(savePhotographer => {
                    return res.json({
                        message: "Password changed successfully",
                        savePhotographer
                    });
                })
            });
        }).catch(err => console.log(err));

}

/** ===============================================================================================
 * PHOTOGRAPHER COMPLETE REGISTRATION TO THE SYSTEM WHEN LOGIN
 * ================================================================================================= *
 */

// file upload code

const storage = multer.diskStorage({
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
    const id = req.params.photographerId;
    const schema = Joi.object({
        dob: Joi.required(),
        fullName: Joi.string().min(4).max(255).required(),
        location: Joi.string().required(),
    });
    const { error } = schema.validate({
        dob: dob,
        fullName: fullName,
        location: location,
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
    await Photographer.findByIdAndUpdate(id).then(photographer => {
        if (!photographer) {
            return res.status(400).json({
                error: "User not found",
            });
        }
        photographer.dob = dob;
        photographer.location = location;
        photographer.fullName = fullName
        photographer.save();
        return res.json({
            message: "Regitration completed successfully",
            photographer
        });
    }).catch(err => {
        return res.status(400).json({
            error: err,
        });
    })
}

/** ===============================================================================================
 * FETCH PHOTOGRAPHY BOOKINGS
 * ================================================================================================= *
 */
exports.photographer_bookings = async (req, res) => {

}

/** ===============================================================================================
 * POst A PICTURE (10 only)
 * ================================================================================================= *
 */


// file upload code

const storage2 = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, './public/photographer/')
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

const uploadSingle2 = multer({
    storage: storage2
}).single('profile_image');

exports.post_picture = async (req, res) => {
    const postedBy = 0;
    const { description } = req.body;
    const schema = Joi.object({
        description: Joi.string().required(),
    });
    const { error } = schema.validate({
        description: description,
    });
    if (error) {
        return res.status(400).json({
            error: error.details[0].message,
        });
    }
    //
    const newPost = new Post({
        description: description,
        postedBy: postedBy,
    });
    uploadSingle2(req, res, (err) => {
        if (err) return res.json.status(400)({ error_code: 1, err_desc: err });
        res.json(req.file);
    });
    await Post.BookPhotography(newPost, (err, post) => {
        if (err) return err;
        return res.status(200).json({
            status: "Sucessful",
            post
        });

    });
}

/** ===============================================================================================
 * FEtch All PICTURE (10 only)
 * ================================================================================================= *
 */
exports.fetch_all_post = async (req, res) => {
    await Post.find().then(post => {
        return res.status(200).json({
            status: "Sucessful",
            post
        });
    }).catch(err => {
        return res.status(200).json({
            status: "fail",
            error: err
        });
    })
}