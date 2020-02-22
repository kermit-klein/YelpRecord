var middlewareObj = {}
var Recordshop = require("../models/recordshop")
var Comment = require("../models/comment")
var Review = require("../models/review")

middlewareObj.checkRecordshopOwnership = (req,res,next) => {
	
		if(req.isAuthenticated()) {
		Recordshop.findById(req.params.id, (err,foundRecordshop)=>{
		if(err || !foundRecordshop) {
			req.flash("error","Recordshop not found")
			res.redirect("back")
		} else {
			if(foundRecordshop.author.id.equals(req.user._id) || req.user.isAdmin) {
				next()
			} else {
				req.flash("error","You don't have permission to do that")
				res.redirect("back")
			}			
		       }
	         })	
	} else {
		req.flash("error","You need to be logged in to do that")
             res.redirect("back")
	}
	
}
	
middlewareObj.checkCommentOwnership = (req,res,next) => {
	
		if(req.isAuthenticated()) {
		Comment.findById(req.params.comment_id, (err,foundComment)=>{
		if(err || !foundComment) {
			req.flash("error","Comment not found")
			res.redirect("back")
		} else {
			if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
				next()
			} else {
				req.flash("error","You don't have permission to do that")
				res.redirect("back")
			}			
		       }
	         })	
	} else {
		req.flash("error","You need to be logged in to do that")
             res.redirect("back")
	}
	
}

middlewareObj.isLoggedIn = (req,res,next) => {
		if(req.isAuthenticated()){
		return next()
	}
	req.flash("error","Please Login First!")
	res.redirect("/login")
}

middlewareObj.checkReviewOwnership = (req, res, next)=> {
    if(req.isAuthenticated()){
        Review.findById(req.params.review_id, (err, foundReview)=>{
            if(err || !foundReview){
                res.redirect("back");
            }  else {
                // does user own the comment?
                if(foundReview.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};


middlewareObj.checkReviewExistence = (req, res, next)=> {
    if (req.isAuthenticated()) {
        Recordshop.findById(req.params.id).populate("reviews").exec((err, foundRecordshop)=> {
            if (err || !foundRecordshop) {
                req.flash("error", "Recordshop not found.");
                res.redirect("back");
            } else {
                // check if req.user._id exists in foundRecordshop.reviews
                var foundUserReview = foundRecordshop.reviews.some((review)=> {
                    return review.author.id.equals(req.user._id);
                });
                if (foundUserReview) {
                    req.flash("error", "You already wrote a review.");
                    return res.redirect("/recordshops/" + foundRecordshop._id);
                }
                // if the review was not found, go to the next middleware
                next();
            }
        });
    } else {
        req.flash("error", "You need to login first.");
        res.redirect("back");
    }
};




















module.exports = middlewareObj