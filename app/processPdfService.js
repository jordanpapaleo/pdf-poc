'use strict';
const PDFJS = require('pdfjs-dist');

(function () {
  function _loadPage(doc, pageNum) {
    return doc.getPage(pageNum).then((page) => {
      page.getViewport(1.0); // scale

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

        console.info(doc.numPages, pagePromises.length);

        return Promise.all(pagePromises);
      });
    },
  };

  module.exports = processPdfService;
}());
