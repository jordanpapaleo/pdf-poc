'use strict';

(function () {
  const utils = require('./utils');
  const THRESHOLD = 2; // Visual position difference allowed to match

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

  function _getAsIsZone(positions) {
    const sorted = positions.sort();
    const ROW_HEIGHT = 9.2;
    return [sorted[0] - ROW_HEIGHT, sorted[sorted.length - 1]];
  }

  function _getHotZones(items) {
    const hotZones = {};
    const asis = [];

    items.forEach((item) => {
      const text = item.text.replace(' ', '').replace('-', '').toLowerCase();

      if (text === 'repairitem') {
        hotZones.repairItems = _getRepairHotZone(item);
      } else if (text.indexOf('asis') !== -1 || text.indexOf('asrepaired') !== -1) {
        asis.push(item.transform[5]);
      }
    });

    if (asis.length > 0) {
      hotZones.asisItems = _getAsIsZone(asis);
    }

    return (hotZones.repairItems || hotZones.asisItems) ? hotZones : false;
  }

  const reoMapService = {
    load(pages) {
      for (let i = 0, j = pages.length; i < j; i++) {
        const page = pages[i];
        const TEST_STRING = 'REAL ESTATE OWNED APPRAISAL ADDENDUM';
        const isREOAddendum = (JSON.stringify(page).indexOf(TEST_STRING) !== -1);

        if (isREOAddendum) {
          console.info(`Page ${i} ${isREOAddendum}`);
          return this.processPage(page);
        }
      }
    },
    processPage(page) {
      const extractedData = {
        repairItems: [],
        asisItems: [],
      };

      this.hotZones = _getHotZones(page);

      const filteredAsIsItems = this.filterResults(page, this.hotZones.asisItems);
      if (filteredAsIsItems && filteredAsIsItems.length > 0) {
        const mappedAsIsValues = this.mapAsIsValues(filteredAsIsItems);
        if (mappedAsIsValues && Object.keys(mappedAsIsValues).length > 0) {
          extractedData.asisItems = this.formatAsIsValues(mappedAsIsValues);
        }
      }

      const filteredRepairItems = this.filterResults(page, this.hotZones.repairItems);
      if (filteredRepairItems && filteredRepairItems.length > 0) {
        const matchedRepairValues = this.matchRepairValues(filteredRepairItems);
        if (matchedRepairValues && matchedRepairValues.length > 0) {
          extractedData.repairItems = this.formatRepairResults(matchedRepairValues);
        }
      }

      return extractedData;
    },
    filterResults(items, dimensions) {
      // filter data from the parsed pdf
      if (dimensions) {
        const min = dimensions[0];
        const max = dimensions[1];

        return items.filter((item) => {
          const position = item.transform[5];

          // Items with a Y transform within the hotzone
          let isValid = (position >= min && position <= max);

          // The following are junk values
          if (item.text === '$' || item.text.indexOf('. . .') !== -1) {
            isValid = false;
          }

          return isValid;
        });
      }
    },
    mapAsIsValues(items) {
      const asisHash = {};
      const sortedItems = _positionSort(items);

      // Find the y transform of fields we need
      sortedItems.forEach((item) => {
        const key = ~~item.transform[5];
        const parsedFloatVal = utils.tryParseFloat(item.text);

        if (item.text.indexOf('AS-') === 1) {
          if (!asisHash[key]) {
            asisHash[key] = {};
          }

          asisHash[key].item = item.text;
        }

        if (parsedFloatVal) {
          if (!asisHash[key]) {
            asisHash[key] = {};
          }

          if (parsedFloatVal >= 120) {
            asisHash[key].price = parsedFloatVal;
          } else {
            asisHash[key].days = item.text;
          }
        }
      });

      return asisHash;
    },
    matchRepairValues(items) {
      const matchedValues = [];
      const sortedItems = _positionSort(items);

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
    formatRepairResults(matchedValues) {
      // the values come back in a non predictable formatRepairResults
      // this sorts the data pairs by their ability to parse into a number
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
            price: parsedValue,
          });
        } else {
          formattedResults.push({
            item: values[0],
            price: utils.tryParseFloat(values[1]),
          });
        }
      }

      return formattedResults;
    },
    formatAsIsValues(items) {
      const formattedResults = [];

      Object.keys(items).forEach((key) => {
        formattedResults.push(items[key]);
      });

      return formattedResults;
    },
  };

  module.exports = reoMapService;
}());
