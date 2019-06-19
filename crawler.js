var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var fs = require('fs');
var prompt = require('prompt')
const Path = require('path')
const Axios = require('axios')
var http = require('http');
var colors = require('colors');
var mongo = require('mongodb');
//var Promise = require('promise');
var pageToVisit = "http://www.liceoartisticobergamo.gov.it/";
var visitedLinks = 0;
var linksThatMatter = [0];
var linksToVisit = [0];
var wordToSearch = "liceo";
var currentRequests = 0;
var $;
var randomI;
var memory = [30];
var deadEnds = 0;

// SETTINGS
const maxRequests = 10;       // Maximum number of parallel requests
const maxPageSize = 500000;   // Maximum body.length to be parsed by cheerio
const reqTimeout = 500;       // Request timeout
const processTimeout = 500;
const resultMaxLength = 100;
const memorySize = 60;

var MongoClient = require('mongodb').MongoClient;
var dbUrl = "mongodb://localhost:27017/mydb";

var options = {
  url: 'http://www.liceoartisticobergamo.gov.it/',
  headers: {
    'User-Agent': "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36"
  },
  timeout: reqTimeout,
};

prompt.message = colors.cyan("\nCHICCO SEARCH \n");
prompt.delimiter = " > "
prompt.start();
prompt.get('Website', function (err, result) {

  if (result.Website) {
      options.url = result.Website;
  }
    crawl();
    //showResults();
});

function showResults() {
  MongoClient.connect(dbUrl, { useNewUrlParser: true }, function(err, db) {
    if (err) throw err;
    var dbo = db.db("chiccosearch");
    dbo.collection("pages").createIndex( { name: "text" } );
    var query = { $text: { $search: wordToSearch } };
    dbo.collection("pages").find(query, { projection: { _id: 0} }).toArray(function(err, result) {
      if (err) throw err;
      result.forEach(function(value, index, array) {
        let pageName = result[index].name;
        if (pageName.length > resultMaxLength) {
            pageName = pageName.substr(0, resultMaxLength);
            pageName = pageName + "..."
        }
        console.log("\n" + colors.cyan(pageName));
        console.log(result[index].url);
      });
      console.log(colors.yellow("\nTrovati " + result.length + " risultati"));
      db.close();
    });
  });
}

function crawl() {
  setInterval(function() {
    //console.log("Visiting page: " + options.url);
    if (options.url && currentRequests < maxRequests) {
      getNewLinkFromPage(options.url, function(newLink, response) {
        currentRequests--;
        //console.log(colors.yellow("Current requests: " + currentRequests));
        if (response == -1) {
          deadEnds++;
          //console.log(colors.green("Found a page that has no links :" + newLink));
          console.log(colors.blue("Dead end"));
          options.url = memory[memory.length-(deadEnds + 1)];
          return;
        }
        if (newLink && response == 1) {
          deadEnds = 0;
          if (memory.length >= memorySize) {
              memory.shift();
          }
          memory.push(newLink);
          visitedLinks++;
          options.url = newLink;
          console.log("Visiting " + newLink);
        }
      });
    }
  }, 100);
}

function followable(link) {
  if (!link || link.indexOf("#") != -1) {
    return false;
    //console.log("Considerato un link ma è un link interno: " + link);
  }
  if (link.indexOf("http://") == -1 && link.indexOf("https://") == -1 || link.indexOf("linkedin") != -1) {
    //console.log("Considerato un link ma non è http: " + link);
    return false;
  }
  if (link.indexOf('?') != -1) {
    //console.log(colors.blue("Considerato un link ma è strano"));
    return false;
  }
  if (memory.find(function(value, index, arr) { return value == link; }))
  {
    return false;
  }
  return true;
}

function getNewLinkFromPage(linkToVisit, callback) {
  if (visitedLinks % 10 == 0) {
    console.log("Visited " + visitedLinks + " links");
  }
  if (currentRequests < -1) {
    return;
  }
  currentRequests++;
  request(linkToVisit, function(error, response, body) {
   if(error) {
     //console.log("Error: " + error);
     if (error.code === 'ETIMEDOUT') {
       //console.log("Timed out request");
     }
     return callback(linkToVisit, -1);
   }
   // Check status code (200 is HTTP OK)
   //console.log("Status code: " + response.statusCode);
   if (response.statusCode < 200 || response.statusCode > 299) {
     return callback(linkToVisit, -1);
   }
   if(response.statusCode === 200) {
     // Parse the document body
     //console.log(colors.yellow("Body length: " + body.length));
     if (body.length > maxPageSize) {
       //console.log(colors.red("Page skipped because of maximum length limits"));
       return callback(linkToVisit, -1);
     }
     $ = cheerio.load(body);
     //var containsWord = search(wordToSearch, $('title').text());
     //if (!containsWord) {
       //containsWord = search(wordToSearch, $('meta[name=description]').content);
     //}

     MongoClient.connect(dbUrl, { useNewUrlParser: true }, function(err, db) {
       if (err) throw err;
       var dbo = db.db("chiccosearch");
       var myobj = { name: $('title').text(), url: linkToVisit };
       dbo.collection("pages").insertOne(myobj, function(err, res) {
         if (err) throw err;
         db.close();
       });
     });

     let found = false;
     //console.log($('a').length + "\n");
     if ($('a').length <= 0) {
       return callback(linkToVisit, -1);
     }
     for (var i = 0; i < $('a').length && !found ; i++) {
       randomI = Math.floor(Math.random()*$('a').length);
        //console.log("Visited pages:" + visitedLinks.length);
        //visitedLinks.push($(this).attr('href'));
        let linkToPass = $('a').eq(randomI).attr('href');
        if (followable(linkToPass)) {
            return callback(linkToPass, 1);
        }
     }
     console.log(colors.red("no followable links"));
     return callback(linkToVisit, -1);
   }
   return;
 });
}

function search(term, body) {
  if (body.indexOf(term) != -1) {
    return true;
  }
  else {
    return false;
  }
}

'use strict'

async function downloadImage (url, name) {
  if (!url) {
      return;
  }
  if (!name) {
      return;
  }
  path = 'D:/Web/Prova_nodejs/' + name;
  const writer = fs.createWriteStream(path);

  const response = await Axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  })
}
