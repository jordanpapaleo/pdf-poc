'use strict';

const fs = require('fs');
const path = require('path');

const dataMapService = require('./dataMapService');
const processPdfService = require('./processPdfService');
const Addendum = require('./Addendum');

const pdfPath = process.argv[2] || path.join(__dirname, '../test-data/REO 2.pdf');
const file = new Uint8Array(fs.readFileSync(pdfPath));

processPdfService.load(file).then(
  (items) => {
    const processedItems = dataMapService.load(items);
    const addendum = new Addendum(processedItems);

    console.info(addendum.render());
    // fs.writeFile('results.json', addendum.render());
  },
  (err) => {
    console.error(`Error: ${err}`);
  }
);
