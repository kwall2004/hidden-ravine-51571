/**
 * VehiclesController
 *
 * @description :: Server-side logic for managing vehicles
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

  getUserVehicles: function (req, res) {
    var userId = req.param('userId');

    Users.findOne({ _id: userId })
      .then(function (user) {
        if (!user) {
          return res.notFound();
        }

        return [user, Devices.find({ clients: { $elemMatch: { id: Devices.mongo.objectId(user.clientId), endDate: null } } })];
      })

      .spread(function (user, devices) {
        return devices.map(function (d) {
          d.loginId = user.loginId;
          d.userName = user.userName;
          return d;
        });
      })

      .then(function (devices) {
        var deviceVehicles = _.uniq(devices.filter(function (d) {
          return !!d.vehicles;
        }).map(function (d) {
          return d.vehicles.map(function (v) {
            v.loginId = d.loginId;
            v.userName = d.userName;
            v.imei = d.imei;
            return v;
          });
        }).reduce(function (acc, cur) {
          return acc.concat(cur);
        }).filter(function (v) {
          return !v.endDate;
        }), 'id');

        return [deviceVehicles, Vehicles.find({ _id: deviceVehicles.map(function (v) { return v.id; }) })];
      })

      .spread(function (deviceVehicles, vehicles) {
        return vehicles.map(function (v) {
          var deviceVehicle = deviceVehicles.find(function (dv) { return dv.id == v.id; });
          v.loginId = deviceVehicle.loginId;
          v.userName = deviceVehicle.userName;
          v.imei = deviceVehicle.imei;
          return v;
        });
      })

      .then(function (vehicles) {
        return res.ok(_.sortBy(vehicles, 'alias'));
      })

      .catch(function (err) {
        sails.log.error(err);
        return res.serverError(err);
      });
  }

};
