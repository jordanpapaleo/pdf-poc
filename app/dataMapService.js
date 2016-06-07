'use strict';

const fs = require('fs');

(function () {
  const utils = require('./utils');

  function _positionSort(items) {
    return items.sort((a, b) => {
      return a.transform[5] - b.transform[5];
    });
  }

  // There are a few cases in which we do not have the correct fields to format
  function _shouldFormat(values) {
    let hasValues = true;

    if (!values[0] || !values[1]) {
      hasValues = false;
    } else if (values[0] === 'ESTIMATED COST' || values[1] === 'ESTIMATED COST') {
      hasValues = false;
    } else if (values[0] === 'REPAIR ITEM' || values[1] === 'REPAIR ITEM') {
      hasValues = false;
    }

    return hasValues;
  }

  function _getRepairHotZone(item) {
    const REPAIR_ITEMS = 12;
    const ROW_HEIGHT = 9.2;
    const minThreshold = item.transform[5] - REPAIR_ITEMS * ROW_HEIGHT;

    return [minThreshold, item.transform[5]];
  }

  function _getCostHotZone() {
    return [];
  }

  function _getHotZones(items) {
    const hotZones = {};

    items.forEach((item) => {
      const text = item.text.replace(' ', '').toLowerCase();
      if (text === 'repairitem') {
        hotZones.repairItems = _getRepairHotZone(item);
      } else if (text === 'estimatedcost') {
        hotZones.cost = _getCostHotZone(item);
      }
    });

    return hotZones;
  }

  const dataMapService = {
    test(items) {
      fs.writeFileSync('BLAR-PLOP.json', JSON.stringify(items, null, 2));
    },
    load(items) {
      if (process.env.TEST_MODE) {
        this.test(items);
      }

      this._items = items;
      this.hotZones = _getHotZones(items);
      const repairItems = this.filterResults(items, this.hotZones.repairItems);

      if (repairItems && repairItems.length > 0) {
        const matchedValues = this.matchValues(repairItems);

        if (matchedValues && matchedValues.length > 0) {
          const formattedResults = this.formatResults(matchedValues);
          return formattedResults;
        }
      }

      return false;
    },
    // filter data from the pdf scrape by page position
    filterResults(items, dimensions) {
      if (dimensions) {
        const min = dimensions[0];
        const max = dimensions[1];

        return items.filter((item) => {
          const position = item.transform[5];
          if (item.text === '$') return false;
          return (position >= min && position <= max);
        });
      }
    },
    matchValues(items) {
      const matchedValues = [];
      const sortedItems = _positionSort(items);
      const THRESHOLD = 2; // Visual position difference allowed to match

      let previousPosition;
      let tempVar = [];
      for (let i = 0, j = sortedItems.length; i < j; i++) {
        const item = sortedItems[i];
        tempVar.push(item.text);

        if (i === 0) {
          previousPosition = item.transform[5];
        } else {
          if (Math.abs(previousPosition - item.transform[5]) <= THRESHOLD) {
            if (tempVar.length === 2) {
              matchedValues.push(tempVar);
              tempVar = [];
            }
          }

          previousPosition = item.transform[5];
        }
      }

      return matchedValues;
    },
    formatResults(matchedValues) {
      const formattedResults = [];

      for (let i = 0, j = matchedValues.length; i < j; i++) {
        const values = matchedValues[i];

        if (!_shouldFormat(values)) {
          continue;
        }

        const parsedValue = utils.tryParseFloat(values[0]);

        if (parsedValue) {
          formattedResults.push({
            item: values[1],
            cost: parsedValue,
          });
        } else {
          formattedResults.push({
            item: values[0],
            cost: utils.tryParseFloat(values[1]),
          });
        }
      }

      return formattedResults;
    },
  };

  module.exports = dataMapService;
}());
