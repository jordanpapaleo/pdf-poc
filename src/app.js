import reoMapService from './reoMapService';
import processPdfService from './processPdfService';
import imageExtractService from './imageExtractService';
import Addendum from './Addendum';

export function processAddendum(file, cb) {
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

export function processForImages(file, cb) {
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
