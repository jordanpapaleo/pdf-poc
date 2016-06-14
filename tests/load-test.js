'use strict';

const fs = require('fs');
const fetch = require('node-fetch');

// Under Construction
(function () {
  fs.readdir('../../test-data', (err, names) => {
    names.forEach((name) => {
      if (name.indexOf('.pdf') !== -1) {
        readFile(name);
      }
    });
  });

  function readFile(file) {
    fs.readFile(`../../test-data/${file}`, (err, data) => {
      if (err) throw err;

      const END_POINT = 'http://SAAS-TR-L-001.local:8080/pdf';
      const options = {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/pdf'
        },
        body: data,
        mode: 'cors'
      };

      fetch(END_POINT, options)
        .then((res) => {
          console.log('Here');
          return res.json();
        })
        .then((json) => {
          console.log(json);
        });
    });
  }
}());
