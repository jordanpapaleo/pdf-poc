'use strict';

(function () {
  const reoMapService = require('./reoMapService');
  const processPdfService = require('./processPdfService');
  const imageExtractService = require('./imageExtractService');
  const Addendum = require('./Addendum');

  function processAddendum(file, cb) {
    const addendum = new Addendum(file);

    processPdfService.load(file).then(
      (pdfPages) => {
        if (process.env.TEST_MODE) {
          // fs.writeFileSync('BLAR-PLOP.json', JSON.stringify(items, null, 2));
        }

        const results = reoMapService.load(pdfPages);

        if (results) {
          addendum.processedPdf = pdfPages;
          addendum.repairItems = results.repairItems;
          addendum.asisItems = results.asisItems;

          if (cb && cb instanceof Function) {
            cb(addendum.data);
          }
        } else {
          cb(false);
        }
      },
      (err) => {
        console.error(`Error: ${err}`);
      }
    );
  }

  function processForImages(file, cb) {
    processPdfService.load(file).then(
      (items) => {
        imageExtractService.load(items);

        if (cb && cb instanceof Function) {
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
