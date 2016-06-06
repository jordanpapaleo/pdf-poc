'use strict';

(function () {
  function positionSort(items) {
    return items.sort((a, b) => {
      return a.transform[5] - b.transform[5];
    });
  }

  function tryParseFloat(value) {
    const tempVal = parseFloat(value.replace(',', ''));
    return (isNaN(tempVal)) ? false : tempVal;
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
      if (item.text === 'REPAIR ITEM') {
        hotZones.repairItems = _getRepairHotZone(item);
      } else if (item.text === 'ESTIMATED COST') {
        hotZones.cost = _getCostHotZone(item);
      }
    });

    return hotZones;
  }

  const dataMapService = {
    load(items) {
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
          return (position >= min && position <= max);
        });
      }
    },
    matchValues(items) {
      const matchedValues = [];
      const sortedItems = positionSort(items);

      let prevPosition;
      let tempVar = [];
      for (let i = 0, j = sortedItems.length; i < j; i++) {
        const item = sortedItems[i];

        if (item.text === '$') {
          continue;
        }

        if (item.transform[5] !== prevPosition) {
          if (tempVar.length) {
            matchedValues.push(tempVar);
            tempVar = [];
          }

          prevPosition = item.transform[5];
        }

        tempVar.push(item.text);
      }

      return matchedValues;
    },
    formatResults(matchedValues) {
      const formattedResults = [];

      matchedValues.forEach((values) => {
        const parsedValue = tryParseFloat(values[0]);

        if (parsedValue) {
          formattedResults.push({
            item: values[1],
            cost: parsedValue,
          });
        } else {
          formattedResults.push({
            item: values[0],
            cost: tryParseFloat(values[1]),
          });
        }
      });

      return formattedResults;
    },
  };

  module.exports = dataMapService;
}());
