require("dotenv").config();
var express = require("express");
var router = express.Router();
var User = require("../models/user");
var Recordshop = require("../models/recordshop");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var passport = require("passport");
var bodyParser = require("body-parser");
var middleware = require("../middleware");
var Notification = require("../models/notification");
router.use(bodyParser.urlencoded({ extended: true }));

// ROUTE LANDING PAGE
router.get("/", (req, res) => {
  res.render("landing");
});

//============
// AUTH ROUTES
//============

//Register page
router.get("/register", (req, res) => {
  res.render("register", { page: "register" });
});
//Register logic
router.post("/register", (req, res) => {
  var newUser = new User({
    username: req.body.username,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    avatar: req.body.avatar,
    email: req.body.email,
  });

  if (req.body.adminCode == "secret1986") {
    newUser.isAdmin = true;
  }
  User.register(newUser, req.body.password, (err, user) => {
    if (err) {
      console.log(err);
      req.flash("error", err.message);
      return res.redirect("/register");
    }
    req.flash("success", "Successfully registered, Welcome " + user.username);
    passport.authenticate("local")(req, res, function () {
      res.redirect("/recordshops");
    });
  });
});

router.get("/login", (req, res) => {
  res.render("login", { page: "login" });
});
//login logic
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/recordshops",
    failureRedirect: "/login",
  }),
  (req, res) => {}
);

//Logout
router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success", "Logged Out!");
  res.redirect("/recordshops");
});

// USER PROFILE

// router.get("/users/:id", (req,res)=> {

// 	User.findById(req.params.id, (err,foundUser)=> {
// 		if(err) {
// 			req.flash("error","User Not Found")
// 			 return res.redirect("/")
// 		}
// 		Recordshop.find().where("author.id").equals(foundUser._id).exec((err,recordshops)=> {
// 			if(err) {
// 			req.flash("error","User Not Found")
// 			 return res.redirect("/")
// 		}
// 			res.render("users/show",{user:foundUser, recordshops:recordshops})
// 		})

// 	})
// })

router.get("/users/:id", async (req, res) => {
  try {
    let user = await User.findById(req.params.id).populate("followers").exec();
    let recordshops = await Recordshop.find()
      .where("author.id")
      .equals(user._id)
      .exec();
    res.render("users/show", { user, recordshops });
  } catch (err) {
    req.flash("error", err.message);
    return res.redirect("back");
  }
});

//Follow User

router.get("/follow/:id", middleware.isLoggedIn, async (req, res) => {
  try {
    let user = await User.findById(req.params.id);
    user.followers.push(req.user._id);
    user.save();
    req.flash("success", "Successfully followed " + user.username + "!");
    res.redirect("/users/" + req.params.id);
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("back");
  }
});

//View all notifications

router.get("/notifications", middleware.isLoggedIn, async (req, res) => {
  try {
    let user = await User.findById(req.user._id)
      .populate({
        path: "notifications",
        options: { sort: { _id: -1 } },
      })
      .exec();
    let allNotifications = user.notifications;
    res.render("notifications/index", { allNotifications: allNotifications });
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("back");
  }
});

//Handle Notifications

router.get("/notifications/:id", middleware.isLoggedIn, async (req, res) => {
  try {
    let notification = await Notification.findById(req.params.id);
    notification.isRead = true;
    notification.save();
    res.redirect(`/recordshops/${notification.recordshopId}`);
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("back");
  }
});

// FORGOT PASSWORD
router.get("/forgot", (req, res) => {
  res.render("forgot");
});

router.post("/forgot", (req, res, next) => {
  async.waterfall(
    [
      function (done) {
        crypto.randomBytes(20, (err, buf) => {
          var token = buf.toString("hex");
          done(err, token);
        });
      },
      function (token, done) {
        User.findOne({ email: req.body.email }, (err, user) => {
          if (!user) {
            req.flash("error", "No account with that email exists.");
            return res.redirect("/forgot");
          }

          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000;
          user.save(function (err) {
            done(err, token, user);
          });
        });
      },

      function (token, user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: "igsaler@gmail.com",
            pass: process.env.GMAILPW,
          },
        });
        var mailOptions = {
          to: user.email,
          from: "igsaler@gmail.com",
          subject: "Node.js YelpCamp Password Reset",
          text:
            "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
            "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
            "http://" +
            req.headers.host +
            "/reset/" +
            token +
            "\n\n" +
            "If you did not request this, please ignore this email and your password will remain unchanged.\n",
        };
        smtpTransport.sendMail(mailOptions, (err) => {
          console.log("mail sent");
          req.flash("success", "Password reset email sent to " + user.email);
          done(err, "done");
        });
      },
    ],
    function (err) {
      if (err) return next(err);
      res.redirect("/forgot");
    }
  );
});

router.get("/reset/:token", (req, res) => {
  User.findOne(
    {
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    },
    (err, user) => {
      if (!user) {
        req.flash("error", "Password token is invalid or has expired.");
        return res.redirect("/forgot");
      }

      res.render("reset", { token: req.params.token });
    }
  );
});

router.post("/reset/:token", (req, res) => {
  async.waterfall(
    [
      function (done) {
        User.findOne(
          {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() },
          },
          (err, user) => {
            if (!user) {
              req.flash(
                "error",
                "Password reset token is invalid or has expired."
              );
              return res.redirect("back");
            }

            if (req.body.password === req.body.confirm) {
              user.setPassword(req.body.password, (err) => {
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;
                user.save((err) => {
                  req.logIn(user, (err) => {
                    done(err, user);
                  });
                });
              });
            } else {
              req.flash("error", "Passwords do not match.");
              return res.redirect("back");
            }
          }
        );
      },

      function (user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: "igsaler@gmail.com",
            pass: process.env.GMAILPW,
          },
        });

        var mailOptions = {
          to: user.email,
          from: "aerbay@gmail.com",
          subject: "Your password has been changed",
          text:
            "Hello,\n\n" +
            "This is a confirmation that the password for your account " +
            user.email +
            " has just been changed.\n",
        };

        smtpTransport.sendMail(mailOptions, (err) => {
          req.flash("success", "Your password has been changed");
          done(err);
        });
      },
    ],
    function (err) {
      res.redirect("/recordshops");
    }
  );
});

module.exports = router;
