var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var fs = require('fs');
var prompt = require('prompt')
const Path = require('path')
const Axios = require('axios')

var pageToVisit = "http://www.liceolussana.gov.it/new/";
var visitedLinks = [0];
var linksThatMatter = [0];

prompt.start();
prompt.get('website', function (err, result) {

  if (result.website) {
      pageToVisit = result.website;
  }
  visitLink(pageToVisit);
  //downloadImage();
  /*request(pageToVisit, function(error, response, body) {
   if(error) {s
     console.log("Error: " + error);
   }
   // Check status code (200 is HTTP OK)
   console.log("Status code: " + response.statusCode);
   if(response.statusCode === 200) {
     // Parse the document body
     var $ = cheerio.load(body);
     visitedLinks.push(pageToVisit);
     fs.writeFile('Post.html', '', function (err) {
       if (err) throw err;
       console.log('Salvato!');
     });
     $('a').each(function () {
       if (!visitedLinks.find(function(value, index, arr) {return value == link;})) {
         var link = $(this).attr("href");
         //console.log("Found: " + link);
         visitLink(link);
         visitedLinks.push(link);
       }
     });*/
     //console.log("Page title:  " + body);
     //console.log("Page title:  " + $.getElementById;
});

function visitLink(linkToVisit) {
  if (visitedLinks.length % 10 == 0) {
    console.log("Visited " + visitedLinks.length + " links");
  }
  if (!linkToVisit || linkToVisit.indexOf("#") != -1) {
    return;
  }
  if (linkToVisit.indexOf("http://") == -1 && linkToVisit.indexOf("https://" == -1)) {
    return;
  }
  if (visitedLinks.find(function(value, index, arr) {return value == linkToVisit;}))
  {
    return;
  }
  visitedLinks.push(linkToVisit);
  console.log("Visiting link " + linkToVisit);
  request(linkToVisit, function(error, response, body) {
   if(error) {
     //console.log("Error: " + error);
     return;
   }
   // Check status code (200 is HTTP OK)
   console.log("Status code: " + response.statusCode);
   if(response.statusCode === 200) {
     // Parse the document body
     var $ = cheerio.load(body);
     console.log($('title').text());
     $('a').each(function () {
        var link = $(this).attr("href");
        //console.log("Found: " + link);
        visitLink(link);
     });
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
