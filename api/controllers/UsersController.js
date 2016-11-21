/**
 * UsersController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var actionUtil = require('sails/lib/hooks/blueprints/actionUtil');
var _ = require('lodash');

module.exports = {

  find: function (req, res) {
    var Model = actionUtil.parseModel(req);
    var where = actionUtil.parseCriteria(req);

    var query = Model.find()
      .where(where)
      .limit(actionUtil.parseLimit(req))
      .skip(actionUtil.parseSkip(req))
      .sort(actionUtil.parseSort(req));
    query
      .then(function (data) {
        var clientIds = _.uniq(data.filter(function (d) {
          return !!d.clientId;
        }).map(function (d) {
          return d.clientId;
        }));

        return [data, Clients.find({ _id: clientIds })];
      })

      .spread(function (data, clients) {
        return data.map(function (d) {
          var client = clients.find(function (c) { return c.id == d.clientId; });
          d.clientName = client.name;

          return d;
        });
      })

      .then(function (data) {
        return [data, Model.count(where)];
      })

      .spread(function (data, count) {
        return res.visionResponse(data, count, 200);
      })

      .catch(function (err) {
        return res.serverError(err);
      });
  },

  create: function (req, res) {
    var Model = actionUtil.parseModel(req);
    var data = actionUtil.parseValues(req);

    delete data.clientName;

    Model.create(data)
      .then(function (data) {
        res.created(data);
      })

      .catch(function (err) {
        return res.serverError(err);
      });
  },

};
