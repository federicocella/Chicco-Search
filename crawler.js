var request = require('request-promise');
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

var options = {
  url: 'http://www.liceoartisticobergamo.gov.it/',
  headers: {
    'User-Agent': "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36"
  }
};

prompt.message = colors.cyan("CHICCO SEARCH \n");
prompt.delimiter = " > "
prompt.start();
prompt.get('Website', function (err, result) {

  if (result.Website) {
      options.url = result.Website;
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
    //console.log("Visiting page: " + options.url);
    getNewLinkFromPage(options.url, function(newLink, response) {
      if (response == -1) {
        console.log(colors.green("Found a  page that has no links"));
        //console.log(visitedLinks);
        options.url = visitedLinks[visitedLinks.indexOf(newLink)-1];
        return;
      }
      console.log("Next link: " + newLink);
      visitedLinks.push(newLink);
      if (options.url && newLink && response == 1) {
        console.log("Visiting " + newLink);
      }
    })
  }, 300);
}

function arrayContainsLink(arr, link) {
  if (!link || link.indexOf("#") != -1) {
    return true;
    console.log("Considerato un link ma è un link interno: " + link);
  }
  if (link.indexOf("http://") == -1 && link.indexOf("https://") == -1 || link.indexOf("linkedin") != -1) {
    console.log("Considerato un link ma non è http: " + link);
    return true;
  }
  if (arr.find(function(value, index, array) { return value == link; }) == undefined) {
    console.log("Trovato un link non visitato: " + link);
    options.url = link;
    return false;
  }
  else {
    console.log("Considerato un link ma è già stato visitato: " + link);
    return true;
  }
}

function getNewLinkFromPage(linkToVisit, callback) {
  if (visitedLinks.length % 500 == 0) {
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
  //console.log("Visiting link " + linkToVisit);
  request(linkToVisit, function(error, response, body) {
   if(error) {
     console.log("Error: " + error);
     return callback(linkToVisit, -1);
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
       return callback(linkToVisit, -1);
     }
     $('a').each(function() {
          if (found == false && arrayContainsLink(visitedLinks, $(this).attr('href')) == false) {
              found = true;
              console.log("Pages visited:" + visitedLinks.length);
              //visitedLinks.push($(this).attr('href'));
              return callback($(this).attr('href'), 1);
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
