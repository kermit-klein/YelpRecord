require('dotenv').config()
var express = require("express")
var router = express.Router()
var Recordshop  = require("../models/recordshop")
var middleware = require("../middleware")
var Notification = require("../models/notification")
var User     = require("../models/user")
var Review = require("../models/review")

var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);


// IMAGE UPLOAD

var multer = require("multer")
var storage = multer.diskStorage({
	filename: (req,file,callback) => {
		callback(null,Date.now()+file.originalname)
	}
	
})
var imageFilter= (req,file,cb)=> {
	//accept only image files
	if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
		return cb(new Error("Only image files are allowed"),false)
	}
	cb(null,true)
}
var upload = multer({storage:storage, fileFilter:imageFilter})

var cloudinary = require("cloudinary")
cloudinary.config({
	cloud_name:"allezz",
	api_key:process.env.CLOUDINARY_API_KEY,
	api_secret:process.env.CLOUDINARY_API_SECRET
})




//CREATE -- add new recordshop
router.post("/",middleware.isLoggedIn,upload.single("image"), (req,res)=> {	
	// get data from form and add to camp array
	var name=req.body.name
	var description=req.body.description
	var price=req.body.price
	var author = {
		id:req.user._id,
		username:req.user.username
	}
	
	geocoder.geocode(req.body.location, function (err,data) {
		if ( err || !data.length) {
			req.flash("error","Invalid address")
			console.log(process.env.GEOCODER_API_KEY)
			console.log(err)
			return res.redirect("back")
		}
		var lat = data[0].latitude
		var lng = data[0].longitude
		var location = data[0].formattedAddress
			//ADD recordshop to database
		cloudinary.v2.uploader.upload(req.file.path, (error,result)=>{
	
			var image = result.secure_url
			var imageId=result.public_id
			var newRecordshop = {name:name,image:image,imageId:imageId, description:description,author:author,price:price, location:location,lat:lat,lng:lng}	

			Recordshop.create(newRecordshop,(err,newlyCreated)=> {
				User.findById(req.user._id).populate("followers").exec((err,user)=> {		
					var newNotification = {
					username:req.user.username,
					recordshopId : newlyCreated.id
				    }
				Notification.create(newNotification,(err,createdNoti)=> {
					for(const follower of user.followers) {
						follower.notifications.push(createdNoti)
						follower.save()
					}
				})
					
					
				})			
		if (err) {
			console.log(err)
		} else {
			console.log("Camp Added")
		}
			res.redirect("/recordshops/"+newlyCreated.id)
			})
			
	})
	
	// redirect back to recordshop page
	})
})

//NEW -- Show form
router.get("/new",middleware.isLoggedIn, (req,res) =>{
	res.render("recordshops/new")
})

// INDEX - show all recordshops
router.get("/", (req,res) => {	
	var noMatch
	if(req.query.search) {
		const regex = new RegExp(escapeRegex(req.query.search),"gi")
				  Recordshop.find({name:regex}, function(err,allRecordshops){
				if(err) {
					console.log(err)
				} else {
					if(allRecordshops.length <1) {
						var noMatch = "No recordshop match that query, please try again"
					}
					res.render("recordshops/index",{recordshops:allRecordshops,page:"recordshops",noMatch:noMatch})
				}		
			})	
	} else {
			//Get all recordshops from DB
			Recordshop.find({}, function(err,allRecordshops){
				if(err) {
					console.log(err)
				} else {
					res.render("recordshops/index",{recordshops:allRecordshops,page:"recordshops",noMatch:noMatch})
				}		
			})	
	}
})

//SHOW -- ADD DESCRIPTION TO CAMPS
router.get("/:id", (req,res) =>{
	//find the recordshop with provided ID
	//render show template with that recordshop
Recordshop.findById(req.params.id).populate("comments likes").populate({
        path: "reviews",
        options: {sort: {createdAt: -1}}
    }).exec((err,foundRecordshop)=>{
		if(err || !foundRecordshop) {
			req.flash("error","Recordshop not found")
			res.redirect("back")
		} else {
			res.render("recordshops/show",{recordshop:foundRecordshop})
		}		
	})
})

//EDIT CAMPGROUND ROUTE

router.get("/:id/edit",middleware.checkRecordshopOwnership,(req,res)=> {
	Recordshop.findById(req.params.id, (err,foundRecordshop)=>{ 
	res.render("recordshops/edit", {recordshop:foundRecordshop})

      })
})

//UPDATE CAMPGROUND ROUTE

router.put("/:id",middleware.checkRecordshopOwnership, upload.single("image"), (req,res)=>{
	geocoder.geocode(req.body.recordshop.location, function(err,data) {
		if ( err || !data.length) {
			req.flash("error","Invalid adress")
			return res.redirect("back")
		}
		req.body.recordshop.lat = data[0].latitude
		req.body.recordshop.lng = data[0].longitude
		req.body.recordshop.location = data[0].formattedAddress
		delete req.body.recordshop.rating //prevent manipulation from put request

		Recordshop.findById(req.params.id, async function(err, recordshop){
        if(err){
            req.flash("error", err.message)
            res.redirect("back")
        } else {
            if (req.file) {
              try {
                  await cloudinary.v2.uploader.destroy(recordshop.imageId)
                  var result = await cloudinary.v2.uploader.upload(req.file.path)
                  recordshop.imageId = result.public_id
                  recordshop.image = result.secure_url
              } catch(err) {
                  req.flash("error", err.message)
                  return res.redirect("back")
              }
            }
            recordshop.name = req.body.recordshop.name
            recordshop.description = req.body.recordshop.description
			recordshop.price = req.body.recordshop.price
            recordshop.save()
            req.flash("success","Successfully Updated!")
            res.redirect("/recordshops/" + recordshop._id)
        }
    })				
	})
	//find and update correct recordshop
})
//DESTROY CAMPGROUND ROUTE

router.delete("/:id",middleware.checkRecordshopOwnership, (req,res)=> {
	Recordshop.findByIdAndRemove(req.params.id,async (err,deletedrecordshop)=>{		
		if(err) {
			req.flash("error",err.message)
			res.redirect("/recordshops")
		} try {
			await cloudinary.v2.uploader.destroy(deletedrecordshop.imageId)
			await Comment.remove({"_id": {$in: deletedrecordshop.comments}})
			await Review.remove({"_id": {$in: deletedrecordshop.reviews}})
			res.redirect("/recordshops")
		} catch(err) {
			if(err) {
				req.flash("error",err.message)
				return res.redirect("back")
			}
		}
	})

})


// LIKES ROUTE

router.post("/:id/like",middleware.isLoggedIn,(req,res)=> {
	Recordshop.findById(req.params.id,(err,foundRecordshop)=> {
		if(err) {
			console.log(err)
			return res.redirect("/recordshops")
		}
		// check if req.user._id exist in foundRecordshop.likes
		var foundUserLike = foundRecordshop.likes.some((like)=>{
			return like.equals(req.user._id)
		})
		if(foundUserLike) {
			//user alread liked,removing it
			foundRecordshop.likes.pull(req.user._id)
		} else {
			//adding new user like
			foundRecordshop.likes.push(req.user._id)
		}
		foundRecordshop.save((err)=>{
			if(err) {
				console.log(err)
				return res.redirect("/recordshops")
			} return res.redirect("/recordshops/"+foundRecordshop._id)
		})
	})
})



function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router


