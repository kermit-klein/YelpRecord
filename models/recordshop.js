var mongoose = require("mongoose")



var recordshopSchema = new mongoose.Schema({
	name:String,
	price: String,
	image:String,
	imageId:String,
	description:String,
	location: String,
	lat: Number,
    lng: Number,
	createdAt : { type:Date, default:Date.now},
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref:"User"
		    },
		username:String
	},
	comments: [{
		
			type: mongoose.Schema.Types.ObjectId,
			ref:"Comment"
		
}],
	likes:[{
		type:mongoose.Schema.Types.ObjectId,
		ref:"User"
	}],
	reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    rating: {
        type: Number,
        default: 0
    }
	
})

var Recordshop = mongoose.model("Recordshop", recordshopSchema)

module.exports = Recordshop