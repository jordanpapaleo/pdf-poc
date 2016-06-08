'use strict';

(function () {
  const reoMapService = require('./reoMapService');
  const processPdfService = require('./processPdfService');
  const Addendum = require('./Addendum');

  function processAddendum(file, cb) {
    const addendum = new Addendum(file);

    processPdfService.load(file).then(
      (items) => {
        addendum.processedPdf = items;

        const results = reoMapService.load(items);

        addendum.repairItems = results.repairItems;
        addendum.asisItems = results.asisItems;

        cb(addendum.data);
      },
      (err) => {
        console.error(`Error: ${err}`);
      }
    );
  }

  module.exports = processAddendum;
}());
