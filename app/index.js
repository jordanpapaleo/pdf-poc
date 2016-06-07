'use strict';

const dataMapService = require('./dataMapService');
const processPdfService = require('./processPdfService');
const Addendum = require('./Addendum');

function doStuff(file, cb) {
  processPdfService.load(file).then(
    (items) => {
      const processedItems = dataMapService.load(items);
      const addendum = new Addendum(processedItems);
      cb(addendum.render());
    },
    (err) => {
      console.error(`Error: ${err}`);
    }
  );
}

module.exports = doStuff;
