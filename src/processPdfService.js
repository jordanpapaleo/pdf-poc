import PDFJS from 'pdfjs-dist';

/*
 This is a service that processes the pages from the pdf parsing
 Specifically for image data
*/

export default {
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
