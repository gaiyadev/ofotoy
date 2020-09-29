const mongoose = require('mongoose');
require('../../database/db');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');
const { ObjectId } = mongoose.Schema.Types;

const transporter = nodemailer.createTransport(sgTransport({
    auth: {
        api_key: 'api key here'
    }
}));


const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 11,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        maxlength: 255,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
    },
    fullName: {
        type: String,
        maxlength: 255,
        minlength: 4,
    },
    location: {
        type: String,
        maxlength: 255,
    },
    dob: {
        type: Date,
    },
    profile_image: {
        type: String,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    resetToken: {
        type: String,
    },
    expiresToken: {
        type: Date
    },
    followers: [
        {
            type: ObjectId,
            ref: "User"
        }
    ],
    reg_date: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', UserSchema);
module.exports = User;

module.exports.newUser = async (newUser, callback) => {
    await bcrypt.hash(newUser.password, 10, (err, hash) => {
        if (err) throw err;
        newUser.password = hash;  //set hash password
        newUser.save(callback); //create New User
    });
    // Send a mail to the register user
    // let transporter = nodemailer.createTransport({
    //     service: 'Gmail',
    //     auth: {
    //         user: process.env.AUTH_EMAIL,
    //         pass: process.env.AUTH_PASSWORD,
    //     }
    // });
    // let mailOptions = {
    //     from: process.env.AUTH_EMAIL,
    //     to: newUser.email,
    //     subject: 'ofotoy',
    //     text: "You have register successfully"
    // };
    // transporter.sendMail(mailOptions, (err) => {
    //     if (err) throw err;
    //     console.log("message Sent Successfully!!" + newUser.email);
    // });
}


// Compare Curent password and new password of user
module.exports.comparePassword = async (password, hash, callback) => {
    await bcrypt.compare(password, hash, (err, isMatch) => {
        if (err) throw err;
        return callback(null, isMatch);
    });
}
