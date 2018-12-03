"use strict";

const express = require("express");
const application = express();
const path = require("path");
const fs = require("fs");
const formidable = require("formidable");
const tesseract = require("node-tesseract");
const LanguageTranslatorV3 = require("watson-developer-cloud/language-translator/v3");
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
require('dotenv').config();
var tools = require('./tools');

let languageTranslator = new LanguageTranslatorV3({
  version: "2018-05-01"
});

let natural_language_understanding = new NaturalLanguageUnderstandingV1({
  version: '2018-03-16'
});

if (fs.existsSync("/opt/lt-service-bind/binding")) {
  const binding = JSON.parse(fs.readFileSync("/opt/lt-service-bind/binding", "utf8"));
  languageTranslator = new LanguageTranslatorV3({
    iam_apikey: binding.apikey,
    url: binding.url,
    version: "2018-05-01"
  });
}

if (fs.existsSync('/opt/nlu-service-bind/binding')) {
  const nlubinding = JSON.parse(fs.readFileSync('/opt/nlu-service-bind/binding', 'utf8'));

  if (nlubinding.username) {
    natural_language_understanding = new NaturalLanguageUnderstandingV1({
      username: nlubinding.username,
      password: nlubinding.password,
      url: nlubinding.url,
      version: '2018-03-16'
    });
  } else {
    natural_language_understanding = new NaturalLanguageUnderstandingV1({
      iam_apikey: nlubinding.apikey,
      url: nlubinding.url,
      version: '2018-03-16'
    });
  }
}

application.use(express.static(path.join(__dirname + './public')));



// application.get("/", function (req, response) {
//   response.json({
//     'message': 'Welcome to Snap and Translate app.'
//   })
// });

application.post("/uploadpic", function (req, result) {
  const form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, function (err, fields, files) {
    if (err) {
      console.log(err);
      tools.setError(result,'Error: No Parameters' )
    } else {
      const fieldValue = JSON.parse(JSON.stringify(fields));
      console.log(fieldValue);
      if (!Object.keys(fields).length) {
        tools.setError(result,'Error: No Parameters' )
        console.log('Error: No Parameters');
        return;
      }
      const options = {
        l: fieldValue.l,
        psm: 1
      };

      console.log(files);
      if ( !Object.keys(files).length){
        tools.setError(result,'Error: No file' )
        console.log('Error: No file');
        return;

      }
      const filePath = JSON.parse(JSON.stringify(files));
      console.log(filePath);
      const imgPath = filePath.file.path;
      
      tesseract.process(imgPath, options, function (err, ocrtext) {
        if (err) {
          console.log(err);
          tools.setError(result,'Error: OCR --' + err )
        } else  if (ocrtext.trim().length == 0){
          console.log('Error: Can not find any characters in the image.');
          tools.setError(result,'Error: Can not find any characters in the image.' )
        }  else {
          console.log('-------ocrtext----------');
          console.log(ocrtext);
          
          const parameters = {
            text: ocrtext.toLowerCase(),
            model_id: fieldValue.modelid
          };
          
          if (options.l != 'eng') {
            languageTranslator.translate(parameters, function (error, response) {
              if (error) {
                console.log(error);
                tools.setError(result,'Error: languageTranslator --' + error )
              } else {
                console.log('-------languageTranslator response----------');
                console.log(JSON.stringify(response, null, 4));
                const labelsvr = response.translations[0].translation;
                console.log('-------languageTranslator translation----------');
                console.log(labelsvr);
                let cleanString = labelsvr.replace(/\n/g, '');
                console.log('-------cleanString----------');
                console.log(cleanString);
                const params = {
                  'text': labelsvr,
                  'features': {
                    sentiment: {},
                    emotion: {}
                  }
                };
                natural_language_understanding.analyze(params, function (err, nluresponse) {
                  if (err) {
                    console.log('error:', err);
                    tools.setError(result,'Error: natural_language_understanding --' + err )
                  } else {
                    const sentresp = JSON.stringify(nluresponse.sentiment.document.label);
                    console.log('-------natural_language_understanding response----------');
                    console.log(sentresp);
                    const emotoutput = JSON.stringify(nluresponse.emotion.document.emotion);
                    console.log('-------emotoutput----------');
                    console.log(emotoutput);
                    tools.setResult(result, cleanString, ocrtext, sentresp, emotoutput, '')
                    console.log('-------result----------');
                  }
                });
              }
            });
          } else {            
            const labelsvr = ocrtext;
            console.log('-------languageTranslator translation----------');
            console.log(labelsvr);
            let cleanString = labelsvr.replace(/\n/g, '');
            console.log('-------cleanString----------');
            console.log(cleanString);
            const params = {
              'text': labelsvr,
              'features': {
                sentiment: {},
                emotion: {}
              }
            };
            natural_language_understanding.analyze(params, function (err, nluresponse) {
              if (err) {
                console.log('error:', err);
                tools.setError(result,'Error: natural_language_understanding --' + err )
              } else {
                const sentresp = JSON.stringify(nluresponse.sentiment.document.label);
                console.log('-------natural_language_understanding response----------');
                console.log(sentresp);
                const emotoutput = JSON.stringify(nluresponse.emotion.document.emotion);
                console.log('-------emotoutput----------');
                console.log(emotoutput);
                tools.setResult(result, cleanString, ocrtext, sentresp, emotoutput, '')
                console.log('-------result----------');
              }
            });

          }
        }
      });
    }
  });
});
const port = process.env.PORT || process.env.VCAP_APP_PORT || 3000;
application.listen(port, function () {
  console.log("Server running on port: %d", port);
});