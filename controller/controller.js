// dependencies
var express = require('express');
var router = express.Router();
var path = require('path');

// request and cheerio to scrape
var request = require('request');
var cheerio = require('cheerio');

// require models
var Article = require('../models/Article.js');
var Comment = require('../models/Comment.js');

// index
router.get('/', function(req, res) {
	res.redirect('/articles');
});

// router.get('/test-scrape', function(req, res) {
//   request(result.link, function(error, response, html) {
//     var $ = cheerio.load(html);

//     $('.l-col__main').each(function(i, element){
//       var result = {};

//       console.log($(this).children('.c-entry-content').children('p').text());
//     });
//   });
// });

// A GET request to scrape the Verge website
router.get('/scrape', function(req, res) {
		// First, we grab the body of the html with request
		request('http://www.theverge.com/science', function(error, response, html) {
			// Then, we load that into cheerio and save it to $ for a shorthand selector
			var $ = cheerio.load(html);
			var titlesArray = [];
			// Now, we grab every article
			$('.c-entry-box--compact__title').each(function(i, element) {
			// Save an empty result object
				var result = {};

				// Add the text and href of every link, and save them as properties of the result object
				result.title = $(this).children('a').text();
				result.link = $(this).children('a').text('href');

				//ensures that no empty title or links are sent to mongodb
				if(result.title !== "" && result.link !== "") {

					//check for duplicates
					if(titlesArray.indexOf(result.title) == -1) {

						// push the saved title to the array
						titlesArray.push(result.title);

						// only add the article if is not already there
						Article.count({ title: result.title }, function(err, test) {

							//if the test is 0, the entry is unique and good to save
							if(test == 0) {

								// create new object utilizing the Article model
								var entry = new Article (result);

								//save entry to mongodb
								entry.save(function(err, doc) {
									if (err) {
										console.log(err);
									} else {
										console.log(doc);
									}
								});
							}
						});
					}
					// Log duplicate articles
					else {
						console.log('Scrape successful! Article already exists in database')
					}

						}
						// Log missing parts
						else {
							console.log('Scrape successful! Article in missing data. Not saved in db')
						}
				});
					// after scrape redirect to index
					res.redirect('/');
			});
});

// grab every article and populate the DOM
router.get('/articles', function(req, res) {
	// newer articles on top
	Article.find().sort({_id: -1})
		// send to handlebars
		.exec(function(err, doc) {
			if (err) {
				console.log(err);
			} else {
				var article = {article: doc};
				res.render('index', article);
			}
		});
});

// retrieve the articles we scraped from the mongoDB in JSON
router.get('/articles-json', function(req, res) {
	Article.find({}, function(err, doc) {
		if (err) {
			console.log(err);
		} else {
			res.json(doc);
		}
	});
});

// clear the database of articles for testing purposes
router.get('/clearAll', function(req, res) {
	Article.remove({}, function(err, doc) {
		if err {
			console.log(err);
		} else {
			console.log('All articles removed');
		}

	});
	res.redirect('/articles-json');
});

router.get('/readArticle/:id', function(req, res) {
	var articleId = req.params.id;
	var hbarsObj = {
		article: [], 
		body: []
	};

	// find article by the ID
	Article.findOne({ _id: articleId})
		.populate('comment')
		.exec(function(err, doc) {
			if (err) {
				console.log('error: ' + err);
			} else {
				hbarsObj.article = doc;
				var link = doc.link;
				 // get article from link
				 request(link, function(error, response, html) {
				 	var $ = cheerio.load(html);

				 	$('.l-col__main').each(function(i, element) {
				 		hbarsObj.body = $(this).children('.c-entry-content').children('p').text();
				 		// send article body and comments to handlebars using hbarsObj
				 		res.render('article', hbarsObj);
				 		// prevent an empty hbarsObj.body
				 		return false; 
				 	});
				 }) ;
			}
		});
});

















module.exports = router;