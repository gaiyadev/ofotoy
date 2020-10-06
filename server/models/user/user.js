const mongoose = require('mongoose');
require('../../database/db');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');
const { ObjectId } = mongoose.Schema.Types;
const Nexmo = require('nexmo');
const fs = require('fs');
const path = require('path');


// Nexmo SMS api setup
// nexmo.message.sendSms(from, to, text);
const nexmo = new Nexmo({
    apiKey: process.env.NEXMO_APIKEY,
    apiSecret: process.env.NEXMO_APISECRET,
    applicationId: process.env.NEXMO_applicationId
});

// Sendgrid APi setup
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
        lowercase: true
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
    userType: {
        type: String,
        enum: ["User", "Photographer"],
        required: true,
        default: "User"
    },
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
    transporter.sendMail({
        to: newUser.email,
        from: 'isukue@gmail.com',
        subject: 'Account created succesfully',
        html: `<p>
              You account has being created successfully..(ofotoy)
             </p>`
    });
    sms
    const from = 'Ofotoy';
    const to = newUser.phone;
    const text = 'Hello from ofotoy SMS API sms test on ofotoy app';
    nexmo.message.sendSms(from, to, text, (err, responseData) => {
        if (err) {
            console.log(err);
        } else {
            if (responseData.messages[0]['status'] === "0") {
                console.log("Message sent successfully.");
            } else {
                console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
            }
        }
    })
}


// Compare Curent password and new password of user
module.exports.comparePassword = async (password, hash, callback) => {
    await bcrypt.compare(password, hash, (err, isMatch) => {
        if (err) throw err;
        return callback(null, isMatch);
    });
}
