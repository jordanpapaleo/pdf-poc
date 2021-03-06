import fs from 'fs';

export default {
  tryParseFloat(value) {
    // will pickup '123-456' as a number bc - can be used for negative values
    const tempVal = parseFloat(value.replace(',', ''));
    return (isNaN(tempVal)) ? false : tempVal;
  },
  getGuid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
  },
  rmFile(filePath) {
    if (fs.statSync(filePath).isFile()) {
      fs.unlinkSync(filePath);
    }
  },
  rmDir(dirPath, removeSelf) {
    const files = fs.readdirSync(dirPath);

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const filePath = `${dirPath}/${files[i]}`;

        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        } else {
          this.rmDir(filePath);
        }
      }
    }

    if (removeSelf || removeSelf === undefined) {
      fs.rmdirSync(dirPath);
    }
  }
};
