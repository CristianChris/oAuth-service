// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('User', new Schema({ 
	//app_id = _id,
	email: String,
    name_surname: String, 
    password: String, 
    admin: Boolean,
    // last timestamp of login
    last_login:  String,
    token: String
}));

