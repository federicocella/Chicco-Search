var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var fs = require('fs');
var prompt = require('prompt')
const Path = require('path')
const Axios = require('axios')

var pageToVisit = "http://www.liceoartisticobergamo.gov.it/";

prompt.start();
prompt.get('website', function (err, result) {

  pageToVisit = result.website;
  console.log("Visiting page " + pageToVisit);
  downloadImage();
  request(pageToVisit, function(error, response, body) {
   if(error) {
     console.log("Error: " + error);
   }
   // Check status code (200 is HTTP OK)
   console.log("Status code: " + response.statusCode);
   if(response.statusCode === 200) {
     // Parse the document body
     var $ = cheerio.load(body);

     fs.writeFile('Post.html', '', function (err) {
       if (err) throw err;
       console.log('Salvato!');
     });
     var i = 0;
     $('a').each(function () {
        i++;
        console.log("Found: " + $(this).attr("href"));
     });
     //console.log("Page title:  " + body);
     //console.log("Page title:  " + $.getElementById;
   }
    });
});

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
