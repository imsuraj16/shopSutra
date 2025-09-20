const e = require('express');
const mongoose = require('mongoose');

// sub schema for address
const addressSchema = new mongoose.Schema({
    street : String,
    city : String,
    state : String,
    country : String,
    zipCode : String,
})



const userSchema = new mongoose.Schema({

    fullName : {
        firstName : {
            type : String,
            required : true
        },
        lastName : {
            type : String,
            required : true
        }
    },

    userName : {
        type : String,
        required : true,
        unique : true
    },

    email : {
        type : String,
        required : true,
        unique : true
    },

    password : {
        type : String,
        select : false,  // when we fetch user data, password will not be returned by default
    },

    role : {
        type : String,
        enum : ['user', 'seller'],
        default : 'user'
    },

    address : [
        addressSchema
    ]
})

const userModel = mongoose.model('user', userSchema);

module.exports = userModel;