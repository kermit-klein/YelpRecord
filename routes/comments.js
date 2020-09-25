var express = require("express");
var router = express.Router({ mergeParams: true });
var Recordshop = require("../models/recordshop");
var Comment = require("../models/comment");
var middleware = require("../middleware");
// ===============
// COMMENTS ROUTES
// ===============

//comments new
router.get("/new", middleware.isLoggedIn, (req, res) => {
  Recordshop.findById(req.params.id, (err, recordshop) => {
    if (err) {
      console.log(err);
    } else {
      res.render("comments/new", { recordshop: recordshop });
    }
  });
});
//comments create
router.post("/", middleware.isLoggedIn, (req, res) => {
  //lookup recordshop using ID
  Recordshop.findById(req.params.id, (err, recordshop) => {
    if (err) {
      console.log(err);
      res.redirect("/recordshops");
    } else {
      Comment.create(req.body.comment, (err, comment) => {
        if (err) {
          req.flash("error", "Something went wrong");
          console.log(err);
        } else {
          //add username and id to comment then save
          comment.author.id = req.user._id;
          comment.author.username = req.user.username;
          comment.save();
          recordshop.comments.push(comment);
          recordshop.save();
          // console.log(comment)
          req.flash("success", "Comment added, thank you!");
          res.redirect("/recordshops/" + recordshop._id);
        }
      });
    }
  });
});

// Comment EDIT ROUTE
router.get(
  "/:comment_id/edit",
  middleware.checkCommentOwnership,
  (req, res) => {
    Recordshop.findById(req.params.id, (err, foundRecordshop) => {
      if (err || !foundRecordshop) {
        req.flash("error", "Can't find recordshop");
        res.redirect("back");
      } else {
        Comment.findById(req.params.comment_id, (err, foundComment) => {
          if (err) {
            console.log(err);
          } else {
            res.render("comments/edit", {
              recordshop_id: req.params.id,
              comment: foundComment,
            });
          }
        });
      }
    });
  }
);

// Comment UPDATE Route
router.put("/:comment_id", middleware.checkCommentOwnership, (req, res) => {
  Recordshop.findById(req.params.id, (err, foundRecordshop) => {
    // NEEDED for manual url manipulation
    if (err || !foundRecordshop) {
      req.flash("error", "Can't find recordshop");
      res.redirect("back");
    } else {
      Comment.findByIdAndUpdate(
        req.params.comment_id,
        req.body.comment,
        (err, updatedComment) => {
          if (err) {
            res.redirect("back");
          } else {
            req.flash("success", "Comment edited successfully");
            res.redirect("/recordshops/" + req.params.id);
          }
        }
      );
    }
  });
});

// Comment DESTROY Route

router.delete("/:comment_id", middleware.checkCommentOwnership, (req, res) => {
  Comment.findByIdAndRemove(req.params.comment_id, (err) => {
    if (err) {
      res.redirect("back");
    } else {
      req.flash("success", "Comment deleted");
      res.redirect("/recordshops/" + req.params.id);
    }
  });
});

module.exports = router;
