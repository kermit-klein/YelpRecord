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


var recordshops = [ 
		{name:"Devon", image:"https://assets.bedful.com/images/769103625cb3dea535b0988144a3412799fc2052/large.jpg" },
		{name:"Grand Teton", image:"https://i.redd.it/x1ymbdka89r11.jpg" },
		{name:"Sonoma", image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSEFaBfdbd7bo3abnkvK2xqx6ik9O1jYxXqOj3t7MTji4fnV7Jv&s" },
		{name:"Devon", image:"https://assets.bedful.com/images/769103625cb3dea535b0988144a3412799fc2052/large.jpg" },
		{name:"Grand Teton", image:"https://i.redd.it/x1ymbdka89r11.jpg" },
		{name:"Sonoma", image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSEFaBfdbd7bo3abnkvK2xqx6ik9O1jYxXqOj3t7MTji4fnV7Jv&s" },
		{name:"Devon", image:"https://assets.bedful.com/images/769103625cb3dea535b0988144a3412799fc2052/large.jpg" },
		{name:"Grand Teton", image:"https://i.redd.it/x1ymbdka89r11.jpg" },
		{name:"Sonoma", image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSEFaBfdbd7bo3abnkvK2xqx6ik9O1jYxXqOj3t7MTji4fnV7Jv&s" }
		]


mongoose.set('useUnifiedTopology', true)
mongoose.set('useNewUrlParser', true)
mongoose.set('useFindAndModify', false)
mongoose.set('useCreateIndex', true);
mongoose.connect("mongodb://localhost/recordv1")

//Mongodb schema setup



// Recordshop.create({
// 	name:"Devon", image:"https://assets.bedful.com/images/769103625cb3dea535b0988144a3412799fc2052/large.jpg",
// description:"Best Recordshop in South England"
// },  function(err,cat) {
// 	if (err) {
// 		console.log(err)
// 	} else {
// 		console.log(cat)
// 	}
// })


app.use(express.static(__dirname +"/public"))
app.set("view engine","ejs")
app.use(bodyParser.urlencoded({extended:true}))



var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Server Has Started!");
})