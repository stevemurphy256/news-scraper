// dependencies
var express = require('express');
var router = express.Router();
var path = require('path');

// request and cheerio to scrape
var request = require('request');
var cheerio = require('cheerio');

// require models
var Article = require('../models/Article.js');
var Article = require('../models/Comment.js');

// index
router.get('/', function(req, res) {
	res.redirect('/articles');
})