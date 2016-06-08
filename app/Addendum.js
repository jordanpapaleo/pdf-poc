'use strict';

(function () {
  class Addendum {
    constructor(pdf) {
      if (pdf) {
        this._pdf = pdf;
      }

      this._data = {};
    }

    get data() {
      return this._data;
    }

    set repairItems(items) {
      this._data.repairItems = items;
    }

    set asisItems(items) {
      this._data.asisItems = items;
    }

    set processedPdf(items) {
      this._processedPdf = items;
    }

    log() {
      return JSON.stringify(this._data, null, 2);
    }
  }

  module.exports = Addendum;
}());
