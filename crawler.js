var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var fs = require('fs');
var prompt = require('prompt')
const Path = require('path')
const Axios = require('axios')
var http = require('http');
var colors = require('colors');
//var Promise = require('promise');
var pageToVisit = "http://www.liceoartisticobergamo.gov.it/";
var visitedLinks = [0];
var linksThatMatter = [0];
var linksToVisit = [0];
var wordToSearch = "liceo";
var currentRequests = 0;

prompt.message = colors.cyan("CHICCO SEARCH");
prompt.delimiter = " > "
prompt.start();
prompt.get('Website', function (err, result) {

  if (result.Website) {
      pageToVisit = result.Website;
  }
  prompt.get('Search', function(err, result) {
    if (result.Search) {
        wordToSearch = result.Search;
    } else {
      wordToSearch = "Liceo";
    }
    crawl();
  });
});
function crawl() {
  setInterval(function() {
    //console.log("Visiting page: " + pageToVisit);
    getNewLinkFromPage(pageToVisit, function(newLink) {
      console.log("Next link: " + newLink);
      visitedLinks.push(newLink);
      if (pageToVisit && newLink) {
        console.log("Visiting " + newLink);
      }
    })
  }, 200);
}

function arrayContainsLink(arr, link) {
  if (arr.find(function(value, index, array) { return value == link; }) == undefined) {
    console.log("Trovato un link non visitato: " + link);
    pageToVisit = link;
    return false;
  }
  else {
    console.log("Considerato un link ma è già stato visitato");
    return true;
  }
  if (!link || link.indexOf("#") != -1) {
    return true;
  }
  if (link.indexOf("http://") == -1 && link.indexOf("https://" == -1)) {
    return true;
  }
}

function getNewLinkFromPage(linkToVisit, callback) {
  if (visitedLinks.length % 500 == 0) {
    console.log("Visited " + visitedLinks.length + " links");
  }
  if (!linkToVisit || linkToVisit.indexOf("#") != -1) {
    return;
  }
  if (linkToVisit.indexOf("http://") == -1 && linkToVisit.indexOf("https://" == -1)) {
    return;
  }
  /*if (visitedLinks.find(function(value, index, arr) { return value == linkToVisit; }))
  {
    return;
  }*/
  if (currentRequests < -1) {
    return;
  }
  currentRequests++;
  //console.log("Visiting link " + linkToVisit);
  request(linkToVisit, function(error, response, body) {
   if(error) {
     console.log("Error: " + error);
     return;
   }
   // Check status code (200 is HTTP OK)
   console.log("Status code: " + response.statusCode);
   if(response.statusCode === 200) {
     // Parse the document body
     var $ = cheerio.load(body);
     var containsWord = search(wordToSearch, $('title').text());
     //if (!containsWord) {
       //containsWord = search(wordToSearch, $('meta[name=description]').content);
     //}
     if (containsWord || 1==1) {
       linksThatMatter.push(linkToVisit);
       console.log(colors.cyan($('title').text()));
       //console.log($('meta[name=description]').attr('content') + "\n");
     }
     let found = false;
     let nLinks = 0;
     console.log($('a').length);
     if ($('a').length <= 0) {
       console.log("Page has no links");
     }
     $('a').each(function() {
          if (found == false && arrayContainsLink(visitedLinks, $(this).attr('href')) == false) {
              found = true;
              console.log("callstack count:" + currentRequests);
              return callback($(this).attr('href'));
          }
     });
     return
   }
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
