'use strict';

const fs = require('fs');
const PDFJS = require('pdfjs-dist');
const pdfPath = process.argv[2] || './data/REO 2.pdf';
const data = new Uint8Array(fs.readFileSync(pdfPath));

let repairHotZone;

const pdfData = PDFJS.getDocument(data);
pdfData.then((doc) => {
  const numPages = doc.numPages;

  let lastPromise = doc.getMetadata().then((meta) => {
    // console.log('# Metadata Is Loaded');
    // console.log('## Info');
    // console.log(JSON.stringify(data.info, null, 2));
    // console.log();

    if (meta.metadata) {
      // console.log('## Metadata');
      // console.log(JSON.stringify(data.metadata.metadata, null, 2));
      // console.log();
    }
  });

  // Loading of the first page will wait on metadata and
  // subsequent loadings will wait on the previous pages.
  // We have top use 1 because in the pdf.js library they subtract by 1
  for (let i = 1; i <= numPages; i++) {
    lastPromise = lastPromise.then(loadPage.bind(null, doc, i));
  }

  return lastPromise;
}).then(
  (items) => {
    console.info('COLLECTING');
    const repairItems = filterResults(items, repairHotZone);

    if (repairItems && repairItems.length > 0) {
      console.info('MATCHING');
      const matchedValues = matchValues(repairItems);

      if (matchedValues && matchedValues.length > 0) {
        const formattedResults = formatResults(matchedValues);
        console.info('RENDERING');
        fs.writeFile('results.json', JSON.stringify(formattedResults, null, 2));
      }
    }
  },
  (err) => {
    console.error(`Error: ${err}`);
  }
);

// filter data from the pdf scrape by page position
function filterResults(items, dimensions) {
  if (dimensions) {
    const min = dimensions[0];
    const max = dimensions[1];

    return items.filter((item) => {
      const position = item.transform[5];
      return (position >= min && position <= max);
    });
  }
}

function matchValues(items) {
  const matchedValues = [];
  const sortedItems = positionSort(items);

  let prevPosition;
  let tempVar = [];
  for (let i = 0, j = sortedItems.length; i < j; i++) {
    const item = sortedItems[i];

    if (item.text === '$') {
      continue;
    }

    if (item.transform[5] !== prevPosition) {
      if (tempVar.length) {
        matchedValues.push(tempVar);
        tempVar = [];
      }

      prevPosition = item.transform[5];
    }

    tempVar.push(item.text);
  }

  return matchedValues;
}

function formatResults(matchedValues) {
  const formattedResults = [];

  matchedValues.forEach((values) => {
    const parsedValue = tryParseFloat(values[0]);

    if (parsedValue) {
      formattedResults.push({
        item: values[1],
        cost: parsedValue,
      });
    } else {
      formattedResults.push({
        item: values[0],
        cost: tryParseFloat(values[1]),
      });
    }
  });

  return formattedResults;
}

function loadPage(doc, pageNum) {
  return doc.getPage(pageNum).then((page) => {
    page.getViewport(1.0); // scale

    return page.getTextContent().then((content) => {
      return content.items.map((item) => {
        if (item.str === 'REPAIR ITEM') {
          repairHotZone = getRepairHotZone(item);
        } else if (item.str === 'ESTIMATED COST') {
          getCostHotZone(item);
        }

        return {
          transform: item.transform, // [scaleX, skewY, skewX, scaleY, translateX, translateY]
          text: item.str,
          width: item.width,
          height: item.height,
        };
      });
    });
  });
}

function getRepairHotZone(item) {
  const REPAIR_ITEMS = 12;
  const ROW_HEIGHT = 9.2;
  const minThreshold = item.transform[5] - REPAIR_ITEMS * ROW_HEIGHT;

  return [minThreshold, item.transform[5]];
}

function getCostHotZone() {
  return [];
}

function positionSort(items) {
  return items.sort((a, b) => {
    return a.transform[5] - b.transform[5];
  });
}

function tryParseFloat(value) {
  const tempVal = parseFloat(value.replace(',', ''));
  return (isNaN(tempVal)) ? false : tempVal;
}
