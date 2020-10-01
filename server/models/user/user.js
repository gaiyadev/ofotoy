const mongoose = require('mongoose');
require('../../database/db');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');
const { ObjectId } = mongoose.Schema.Types;

const transporter = nodemailer.createTransport(sgTransport({
    auth: {
        api_key: process.env.SENDGRID_API_KEY
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
        type: String,
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
    following: [
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
    // transporter.sendMail({
    //     to: newUser.email,
    //     from: 'isukue@gmail.com',
    //     subject: 'Account created succesfully',
    //     html: `<p>
    //           You account has being created successfully..(ofotoy)
    //          </p>`
    // });
}


// Compare Curent password and new password of user
module.exports.comparePassword = async (password, hash, callback) => {
    await bcrypt.compare(password, hash, (err, isMatch) => {
        if (err) throw err;
        return callback(null, isMatch);
    });
}
