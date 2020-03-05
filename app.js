require('dotenv').config()

var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
	Recordshop  = require("./models/recordshop"),
	Comment     = require("./models/comment"),
	User     = require("./models/user"),
	seedDB = require("./seeds"),
	passport = require("passport"),
	LocalStrategy = require("passport-local"),
	methodOverride = require("method-override"),
	flash = require("connect-flash")

var commentRoutes = require("./routes/comments")
var recordshopRoutes = require("./routes/recordshop")
var indexRoutes = require("./routes/index")
var moment = require("moment")
var reviewRoutes     = require("./routes/reviews")
app.locals.moment = require("moment")

// seedDB() 

// PASSPORT CONFIG

app.use(require("express-session")({
	secret:"Join the dark side",
	resave: false,
	saveUninitialized:false
}))

app.use(methodOverride("_method"))
app.use(flash())

app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use(async function(req, res, next){
   res.locals.currentUser = req.user;
   if(req.user) {
    try {
      let user = await User.findById(req.user._id).populate('notifications', null, { isRead: false }).exec();
      res.locals.notifications = user.notifications.reverse();
    } catch(err) {
      console.log(err.message);
    }
   }
   res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
   next();
});

app.use(indexRoutes)
app.use("/recordshops",recordshopRoutes)
app.use("/recordshops/:id/comments",commentRoutes)
app.use("/recordshops/:id/reviews", reviewRoutes)


mongoose.set('useUnifiedTopology', true)
mongoose.set('useNewUrlParser', true)
mongoose.set('useFindAndModify', false)
mongoose.set('useCreateIndex', true);
mongoose.connect("mongodb+srv://allezz:"+process.env.MONGODBPASS+"@allezz-80gfb.mongodb.net/test?retryWrites=true&w=majority", {
	useNewUrlParser:true,
	useCreateIndex:true
}).then(()=>{
	console.log("MongoDB Connected")
}).catch(err=>{
	console.log("ERROR:",err.message)
})


app.use(express.static(__dirname +"/public"))
app.set("view engine","ejs")
app.use(bodyParser.urlencoded({extended:true}))



var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Server Has Started!");
})