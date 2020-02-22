var mongoose = require("mongoose")

var notificationSchema = new mongoose.Schema({
	username:String,
	campgroundId:String,
	isRead : {type:Boolean,default:false}	
})

var Notification = mongoose.model("Notification",notificationSchema)

module.exports = Notification