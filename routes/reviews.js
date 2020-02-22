var express = require("express");
var router = express.Router({mergeParams: true});
var Recordshop = require("../models/recordshop");
var Review = require("../models/review");
var middleware = require("../middleware");


// Reviews Index
router.get("/",(req,res)=>{
	Recordshop.findById(req.params.id).populate({
		path:"reviews",
		options:{sort:{createdAt:-1}}
	}).exec((err,foundRecordshop)=>{
		if(err||!foundRecordshop) {
			req.flash("error", err.message)
			return res.redirect("back")
		} 
		res.render("reviews/index",{recordshop:foundRecordshop})
	})
})

// Reviews NEW

router.get("/new",middleware.isLoggedIn,middleware.checkReviewExistence,(req,res)=> {
// middleware.checkReviewExistence checks if a user already reviewed the recordshop, only one review per user is allowed
	Recordshop.findById(req.params.id,(err,foundRecordshop)=>{
		if(err) {
			req.flash("error",err.message)
			return res.redirect("back")
		}
		res.render("reviews/new",{recordshop:foundRecordshop})
	})
	
})

// Reviews CREATE

router.post("/",middleware.isLoggedIn,middleware.checkReviewExistence,(req,res)=>{
//lookup recordshop using ID
	Recordshop.findById(req.params.id).populate("reviews").exec((err,foundRecordshop)=>{ 
		if(err) {
		req.flash("error",err.message)
		return res.redirect("back")
	 }
		Review.create(req.body.review,(err,review)=>{
		if(err) {
		req.flash("error",err.message)
		return res.redirect("back")
	 }
	//add author username/id and associated recordshop to the review
			review.author.id=req.user._id
			review.author.username=req.user.username
			review.recordshop = foundRecordshop
			review.save()
			foundRecordshop.reviews.push(review)
			foundRecordshop.rating=calculateAverage(foundRecordshop.reviews)
			foundRecordshop.save()
			req.flash("success","Your review has been successfully added")
			res.redirect("/recordshops/"+foundRecordshop._id)
																							
		})
		
	})
	
	
	
})

// Reviews EDIT

router.get("/:review_id/edit",middleware.checkReviewOwnership,(req,res)=> {
	Review.findById(req.params.review_id, (err,foundReview)=> {
		if (err) {
			req.flash("error",err.message)
			return res.redirect("back")
		}
		res.render("reviews/edit", {recordshop_id:req.params.id, review:foundReview})
	})
})

// Reviews Update
router.put("/:review_id", middleware.checkReviewOwnership, (req, res)=> {
    Review.findByIdAndUpdate(req.params.review_id, req.body.review, {new: true}, (err, updatedReview)=> {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Recordshop.findById(req.params.id).populate("reviews").exec((err, recordshop)=> {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // recalculate recordshop average
            recordshop.rating = calculateAverage(recordshop.reviews);
            //save changes
            recordshop.save();
            req.flash("success", "Your review was successfully edited.");
            res.redirect('/recordshops/' + recordshop._id);
        });
    });
});


// Reviews Delete
router.delete("/:review_id", middleware.checkReviewOwnership, (req, res)=> {
    Review.findByIdAndRemove(req.params.review_id, (err)=> {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Recordshop.findByIdAndUpdate(req.params.id, {$pull: {reviews: req.params.review_id}}, {new: true}).populate("reviews").exec((err, recordshop)=> {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // recalculate recordshop average
            recordshop.rating = calculateAverage(recordshop.reviews);
            //save changes
            recordshop.save();
            req.flash("success", "Your review was deleted successfully.");
            res.redirect("/recordshops/" + req.params.id);
        });
    });
});

function calculateAverage(reviews) {
    if (reviews.length === 0) {
        return 0;
    }
    var sum = 0;
    reviews.forEach(function (element) {
        sum += element.rating;
    });
    return sum / reviews.length;
}

module.exports = router

