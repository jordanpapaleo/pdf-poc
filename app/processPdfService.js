'use strict';
const PDFJS = require('pdfjs-dist');

(function () {
  function _loadPage(doc, pageNum) {
    return doc.getPage(pageNum).then((page) => {
      page.getViewport(1.0); // scale

      return page.getTextContent().then((content) => {
        return content.items.map((item) => {
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

  const processPdfService = {
    load(file) {
      return PDFJS.getDocument(file).then((doc) => {
        const numPages = doc.numPages;
        let lastPromise = doc.getMetadata().then((meta) => {
          console.log('# Metadata Is Loaded');
          console.log(JSON.stringify(meta.info, null, 2));
        });

        // Loading of the first page will wait on metadata and
        // subsequent loadings will wait on the previous pages.
        // We have top use 1 because in the pdf.js library they subtract by 1
        for (let i = 1; i <= numPages; i++) {
          lastPromise = lastPromise.then(_loadPage.bind(null, doc, i));
        }

        return lastPromise;
      });
    },
  };

  module.exports = processPdfService;
}());
