'use strict';

(function () {
  const reoMapService = require('./reoMapService');
  const processPdfService = require('./processPdfService');
  const Addendum = require('./Addendum');

  function processAddendum(file, cb) {
    const addendum = new Addendum(file);

    processPdfService.load(file).then(
      (items) => {
        console.info('Addendum-----------------');

        addendum.processedPdf = items;

        const results = reoMapService.load(items);

        console.info(items);
        console.info('END-----------------');

        addendum.repairItems = results.repairItems;
        addendum.asisItems = results.asisItems;

        cb(addendum.data);
      },
      (err) => {
        console.error(`Error: ${err}`);
      }
    );
  }

  function processForImages(file, cb) {
    processPdfService.load(file).then(
      (items) => {
        console.info('Images-----------------');
        console.info(items.length);
        console.info('END-----------------');

        if (cb) {
          cb();
        }
      },
      (err) => {
        console.error(`Error: ${err}`);
      }
    );
  }

  module.exports = {
    processAddendum,
    processForImages,
  };
}());
