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
var visitedLinks = [0];
var linksThatMatter = [0];
var linksToVisit = [0];
var wordToSearch = "liceo";
var currentRequests = 0;

// SETTINGS
const maxRequests = 20;       // Maximum number of parallel requests
const maxPageSize = 500000;   // Maximum body.length to be parsed by cheerio
const reqTimeout = 800;       // Request timeout
const resultMaxLength = 100;

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
  prompt.get('Search', function(err, result) {
    if (result.Search) {
        wordToSearch = result.Search;
    } else {
      wordToSearch = "Liceo";
    }
    //crawl();
    showResults();
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
          //console.log(colors.green("Found a page that has no links :" + newLink));
          //console.log(visitedLinks);
          options.url = visitedLinks[visitedLinks.indexOf(newLink)-1];
          return;
        }
        visitedLinks.push(newLink);
        if (newLink && response == 1) {
          //console.log("Visiting " + newLink);
        }
      });
    }
  }, 100);
}

function arrayContainsLink(arr, link) {
  if (!link || link.indexOf("#") != -1) {
    return true;
    //console.log("Considerato un link ma è un link interno: " + link);
  }
  if (link.indexOf("http://") == -1 && link.indexOf("https://") == -1 || link.indexOf("linkedin") != -1) {
    //console.log("Considerato un link ma non è http: " + link);
    return true;
  }
  if (link.indexOf('?') != -1) {
    //console.log(colors.blue("Considerato un link ma è strano"));
    return true;
  }
  if (arr.find(function(value, index, array) { return value == link; }) == undefined) {
    //console.log("Trovato un link non visitato: " + link);
    options.url = link;
    return false;
  }
  else {
    //console.log("Considerato un link ma è già stato visitato: " + link);
    return true;
  }
}

function getNewLinkFromPage(linkToVisit, callback) {
  if (visitedLinks.length % 50 == 0) {
    console.log("Visited " + visitedLinks.length + " links");
  }
  /*if (visitedLinks.find(function(value, index, arr) { return value == linkToVisit; }))
  {
    return;
  }*/
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
     var $ = cheerio.load(body);
     var containsWord = search(wordToSearch, $('title').text());
     //if (!containsWord) {
       //containsWord = search(wordToSearch, $('meta[name=description]').content);
     //}
     if (containsWord || 1 == 1) {
       linksThatMatter.push(linkToVisit);
       //console.log(colors.cyan($('title').text()));
       //console.log(linkToVisit);
     }

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
     $('a').each(function() {
          if (found == false && arrayContainsLink(visitedLinks, $(this).attr('href')) == false) {
              found = true;
              //console.log("Visited pages:" + visitedLinks.length);
              //visitedLinks.push($(this).attr('href'));
              let linkToPass = $(this).attr('href');
              return callback(linkToPass, 1);
          }
     });
     if (!found) {
       return callback(linkToVisit, -1);
     }
     return;
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
