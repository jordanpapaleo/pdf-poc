'use strict';

(function () {
  class Addendum {
    constructor(data) {
      this._data = data;
    }

    render() {
      return JSON.stringify(this._data);
    }
  }

  module.exports = Addendum;
}());
