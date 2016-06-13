'use strict';
const fs = require('fs');
const PDFJS = require('pdfjs-dist');

let plop = 1;
(function () {
  function _loadPage(doc, pageNum) {
    if (plop === 1) {
      for (var key in doc) {
        console.info('Doc Keys: ', key);
      }

      plop++
    }

    return doc.getPage(pageNum).then((page) => {
      page.getViewport(1.0); // scale

      if (plop === 2) {
        // fs.writeFileSync('page.json', JSON.stringify(page, null, 2));
        Object.keys(page).forEach((key) => {
          console.info('Page Keys: ', key);
        })

        page.getOperatorList().then((opList) => {
          console.info('-----------------------------');
          // console.info('Page commonObjs', page.commonObjs);
          // console.info('Page objs', page.objs);
          // console.info('OP List', opList);
          console.info('-----------------------------');
        });

        plop++;
      }

      return page.getTextContent().then((content) => {
        const mappedItems = content.items.map((item) => {
          return {
            transform: item.transform, // [scaleX, skewY, skewX, scaleY, translateX, translateY]
            text: item.str.trim().replace(/\s+/g, ' '),
            width: item.width,
            height: item.height,
          };
        });

        return mappedItems;
      });
    });
  }

  const processPdfService = {
    load(file) {
      return PDFJS.getDocument(file).then((doc) => {
        const pagePromises = [];

        for (let i = 1; i <= doc.numPages; i++) {
          pagePromises.push(_loadPage(doc, i));
        }

        return Promise.all(pagePromises);
      });
    },
  };

  module.exports = processPdfService;
}());
