var mongoose = require("mongoose")
var Recordshop = require("./models/recordshop")
var Comment = require("./models/comment")

var seeds = [ 
		{name:"Salmon Creek", image:"https://cdn.pixabay.com/photo/2015/03/26/10/29/camping-691424_960_720.jpg",
description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."},
		{name:"Coldfire Creek", image:"https://cdn.pixabay.com/photo/2019/10/03/11/14/camp-4522970_960_720.jpg",
description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."},
		{name:"Tempest Creek", image:"https://cdn.pixabay.com/photo/2016/01/19/16/48/teepee-1149402_960_720.jpg",
description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.2"}
		]

async function seedDB() {
	
	//remove all recordshops
	// Recordshop.deleteMany({}, (err)=>{
	// if(err) {
	// 	console.log(err)
	// } else {
	// 	console.log("Database deleted")
	// 		// add recordshops
	// data.forEach((seed)=>{
	// 	Recordshop.create(seed, (err,createdData)=>{
	// 		if(err) {
	// 			console.log(err)
	// 		} else {
	// 			console.log("seed camground added")
	// 			// add few comments
	// 			Comment.create({
	// 				text:"this place is great but i wish there was internet",
	// 			    author:"Lex Luthor"
	// 			}, (err,comment)=> {
	// 				if(err) {
	// 					console.log(err)
	// 				} else {
	// 				createdData.comments.push(comment)
	// 				createdData.save()
	// 					console.log("created new comment")
	// 				}
	// 			})
	// 		}
	// 	})
	// })
	// }
    // })

	try { 
	
	await Recordshop.remove({});
	console.log("Recordshops removed");
	await Comment.remove({});
	console.log("Comments removed");
    
	for (const seed of seeds) {
		let recordshop = await Recordshop.create(seed)
		console.log("Recordshop created");
		let comment = await Comment.create(
		 {
			 text:"This place is great, but i wish there was internet",
			 author:"Home Simpson"
		 }
		)
		console.log("Comment created");
		recordshop.comments.push(comment);
		recordshop.save();
		console.log("Comment added to recordshop");
	}	
}    catch(err) {
		console.log(err)
	}
	
	
    // try {
    //     await Recordshop.remove({});
    //     console.log('Recordshops removed');
    //     await Comment.remove({});
    //     console.log('Comments removed');

    //     for(const seed of seeds) {
    //         let recordshop = await Recordshop.create(seed);
    //         console.log('Recordshop created');
    //         let comment = await Comment.create(
    //             {
    //                 text: 'This place is great, but I wish there was internet',
    //                 author: 'Homer'
    //             }
    //         )
    //         console.log('Comment created');
    //         recordshop.comments.push(comment);
    //         recordshop.save();
    //         console.log('Comment added to recordshop');
    //     }
    // } catch(err) {
    //     console.log(err);
    // }
	
	
	
	
    } 
		

module.exports = seedDB



