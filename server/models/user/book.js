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

const BookPhotographySchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        maxlength: 255,
    },
    phone: {
        type: String,
        required: true,
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
    bookedBy: {
        type: ObjectId
    },
    photographerBooked: {
        type: ObjectId,
    },
    userType: {
        type: String,
        required: true
    },
    time: {
        type: String,
    },
    booked_date: {
        type: Date,
        default: Date.now
    }
});

const BookPhotography = mongoose.model('Booking', BookPhotographySchema);
module.exports = BookPhotography;

module.exports.BookPhotography = async (newBooking, callback) => {
    await newBooking.save(callback); //create New Booking
    transporter.sendMail({
        to: newBooking.email,
        from: 'isukue@gmail.com',
        subject: 'Booked successfully',
        html: `<p>
                 You are recieving this mail because you requested for Photography session
             </p>`
    });
}
