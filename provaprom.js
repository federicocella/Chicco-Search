var rp = require('request-promise');
var cheerio = require('cheerio');
var URL = require('url-parse');
var fs = require('fs');
var http = require('http');

var cheerio = require('cheerio'); // Basically jQuery for node.js

var options = {
    uri: 'http://wwww.google.com',
    transform: function (body) {
        return cheerio.load(body);
    }
};

rp(options)
    .then(function ($) {
        // Process html like you would with jQuery...
        console.log("1");
        rp(options).then(function($) {
          console.log("2");
        });
    })
    .catch(function (err) {
        // Crawling failed or Cheerio choked...
        console.log("failed");
    })
    .finally(function() {
      console.log("1");
      rp('http://www.liceolussana.gov.it/new/')
        .then(function($) {
          console.log("2");
        })
        .catch(function(err) {
          console.log("failed: " + err);
        });
    });
