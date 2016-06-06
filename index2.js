require('pdfjs-dist');
var fs = require('fs');
var data = new Uint8Array(fs.readFileSync('./data/REO 1.pdf'));

PDFJS.getDocument(data).then((pdfDocument) => {
  console.log('Number of pages: ' + pdfDocument.numPages);
  console.log(pdfDocument)
  fs.writeFile('./index2.json', JSON.stringify(pdfDocument, null, 2));
});
