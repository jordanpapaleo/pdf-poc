const fs = require('fs');
const PDFParser = require('pdf2json/PDFParser');
const pdfParser = new PDFParser();

pdfParser.on('pdfParser_dataError', (errData) => {
  console.error(errData.parserError)
});

pdfParser.on('pdfParser_dataReady', (pdfData) => {
  const Pages = pdfData.formImage.Pages
  const extractedText = []

  Pages.forEach((page) => {
    const Texts = page.Texts

    Texts.forEach((text) => {
      const tempText = {
        x: text.x,
        y: text.y,
        w: text.w,
        text: []
      }

      text.R.forEach((textRun) => {
        tempText.text.push(decodeURIComponent(textRun.T))
      })

      extractedText.push(tempText)
    })
  })

  fs.writeFile('index1.json', JSON.stringify(extractedText, null, 2));
});

pdfParser.loadPDF('./data/REO 1.pdf');
