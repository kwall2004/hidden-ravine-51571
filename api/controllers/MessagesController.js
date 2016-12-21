var elasticsearch = require('elasticsearch');
var moment = require('moment');

var host = 'https://zix2f09c:89ujd04zflm5n3xu@aralia-3045944.us-east-1.bonsaisearch.net';

module.exports = {

  getTrips: function (req, res) {
    var vehicleId = req.param('vehicleId');
    var startDate = moment(req.param('date')).format('YYYY-MM-DD');
    var endDate = moment(startDate).add(1, 'days').format('YYYY-MM-DD');

    var client = new elasticsearch.Client({
      host: host
    });

    var messages = [];

    client.search({
      index: 'vision',
      type: 'message',
      scroll: '30s',
      body: {
        query: {
          bool: {
            must: [
              {
                term: { vehicleId: vehicleId }
              },
              {
                range: {
                  d: {
                    gte: startDate,
                    lt: endDate
                  }
                }
              }
            ],
            should: [{
              exists: { field: 'm240' }
            }, {
              exists: { field: 'm241' }
            }],
            minimum_should_match: 1
          }
        },
        sort: 'd'
      }
    }, storeHits);

    function storeHits(error, response) {
      if (error) {
        sails.log.error(error);
        return res.serverError(error);
      }

      response.hits.hits.forEach(function (hit) {
        messages.push(hit._source);
      });

      if (response.hits.total === messages.length) {
        return res.ok(messages);
      }

      client.scroll({
        scrollId: response._scroll_id,
        scroll: '30s'
      }, storeHits);
    }
  },

  getTrip: function (req, res) {
    var id = req.param('id');

    var client = new elasticsearch.Client({
      host: host
    });

    var messages = [];

    client.search({
      index: 'vision',
      type: 'message',
      scroll: '30s',
      body: {
        query: {
          bool: {
            must: [
              {
                term: { tripId: id }
              },
            ]
          }
        },
        sort: 'd'
      }
    }, storeHits);

    function storeHits(error, response) {
      if (error) {
        sails.log.error(error);
        return res.serverError(error);
      }

      response.hits.hits.forEach(function (hit) {
        messages.push(hit._source);
      });

      if (response.hits.total === messages.length) {
        return res.ok(messages);
      }

      client.scroll({
        scrollId: response._scroll_id,
        scroll: '30s'
      }, storeHits);
    }
  },

  getLastTripStart: function (req, res) {
    var vehicleId = req.param('vehicleId');

    var client = new elasticsearch.Client({
      host: host
    });

    var messages = [];

    client.search({
      index: 'vision',
      type: 'message',
      body: {
        query: {
          bool: {
            must: [
              {
                term: { vehicleId: vehicleId }
              },
              {
                exists: { field: 'm240' }
              }
            ]
          }
        },
        sort: {
          d: { order: 'desc' }
        },
        size: 1
      }
    }, function (error, response) {
      if (response.hits.hits.length > 0) {
        return res.ok(response.hits.hits[0]._source);
      }
      else {
        return res.ok();
      }
    });
  }

}
