const mongoose = require('mongoose');
require('../../database/db');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema({
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
        maxlength: 11,
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
    userType: {
        type: String,
        required: true,
        default: "Admin"
    },
    reg_date: {
        type: Date,
        default: Date.now
    }
});

const Admin = mongoose.model('Admin', AdminSchema);
module.exports = Admin;

module.exports.createAdmin = async (newAdmin, callback) => {
    await bcrypt.hash(newAdmin.password, 10, (err, hash) => {
        if (err) throw err;
        newAdmin.password = hash;  //set hash password
        newAdmin.save(callback); //create New User
    });
}


// Compare Curent password and new password of user
module.exports.comparePassword = async (password, hash, callback) => {
    await bcrypt.compare(password, hash, (err, isMatch) => {
        if (err) throw err;
        return callback(null, isMatch);
    });
}
