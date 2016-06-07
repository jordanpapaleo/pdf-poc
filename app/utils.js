'use strict';

const fs = require('fs');

(function () {
  const utils = {
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
    },
  };

  module.exports = utils;
}());
