/**
 * DevicesController
 *
 * @description :: Server-side logic for managing devices
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var _ = require('lodash');

function getDeviceAggregation(collection, match, sort, skip, limit, cb) {
  var pipeline = [];
  pipeline.push({
    $lookup: {
      localField: 'currentClient.id',
      from: 'clients',
      foreignField: '_id',
      as: 'client'
    }
  });
  pipeline.push({
    $lookup: {
      localField: 'currentVehicle.id',
      from: 'vehicles',
      foreignField: '_id',
      as: 'vehicle'
    }
  });
  pipeline.push({
    $unwind: {
      path: '$client',
      preserveNullAndEmptyArrays: true
    }
  });
  pipeline.push({
    $unwind: {
      path: '$vehicle',
      preserveNullAndEmptyArrays: true
    }
  });
  pipeline.push({
    $project: {
      _id: 0,
      id: '$_id',
      imei: 1,
      groupId: 1,
      firmwareVersion: 1,
      configVersion: 1,
      serialNumber: 1,
      vehicleAlias: 1,
      vehicleAliasSort: { $toUpper: '$vehicleAlias' },
      clientId: '$client._id',
      clientName: '$client.name',
      clientNameSort: { $toUpper: '$client.name' },
      vehicleId: '$vehicle._id',
      make: '$vehicle.make',
      model: '$vehicle.model',
      modelYear: '$vehicle.modelYear',
      vin: '$vehicle.vin',
      odometer: '$vehicle.odometer',
      createdAt: 1
    }
  });
  if (match) pipeline.push({ $match: match });
  if (sort) pipeline.push({ $sort: sort });
  if (skip) pipeline.push({ $skip: skip });
  if (limit) pipeline.push({ $limit: limit });

  collection.aggregate(pipeline, function (err, data) {
    if (err) {
      cb(err);
      return;
    }

    if (limit) pipeline.pop();
    if (skip) pipeline.pop();
    if (sort) pipeline.pop();

    pipeline.push({
      $group: {
        _id: null,
        count: { $sum: 1 }
      }
    });

    collection.aggregate(pipeline, function (err, result) {
      if (err) {
        cb(err);
        return;
      }

      cb(null, data, result && result.length > 0 ? result[0].count : 0);
    });
  });
}

module.exports = {

  find: function (req, res) {
    var match = req.param('match');
    if (match && match.clientId && typeof match.clientId == 'string') match.clientId = ObjectID(match.clientId);
    var sort = req.param('sort') ? _.mapValues(req.param('sort'), function (value) { return parseInt(value) }) : undefined;
    var skip = parseInt(req.param('skip'));
    var limit = parseInt(req.param('limit'));

    MongoClient
      .connect(sails.config.connections.visionMongoDBServer.url)

      .then(function (db) {
        var devicesCollection = db.collection('devices');

        getDeviceAggregation(devicesCollection, match, sort, skip, limit, function (err, devices, count) {
          db.close();

          if (err) return res.serverError(err);

          return res.visionResponse(devices, count, 200);
        });
      })

      .catch(function (err) {
        return res.serverError(err);
      });
  },

  findOne: function (req, res) {
    var match = { _id: ObjectID(req.param('id')) }

    MongoClient
      .connect(sails.config.connections.visionMongoDBServer.url)

      .then(function (db) {
        var devicesCollection = db.collection('devices');

        getDeviceAggregation(devicesCollection, match, null, null, null, function (err, devices, count) {
          db.close();

          if (err) return res.serverError(err);

          return res.ok(devices[0]);
        });
      })

      .catch(function (err) {
        return res.serverError(err);
      });
  },

  create: function (req, res) {
    MongoClient
      .connect(sails.config.connections.visionMongoDBServer.url)

      .then(function (db) {
        var devicesCollection = db.collection('devices');

        var insert = {
          imei: req.body.imei,
          groupId: req.body.groupId,
          firmwareVersion: req.body.firmwareVersion,
          configVersion: req.body.configVersion,
          serialNumber: req.body.serialNumber,
          currentClient: {
            id: ObjectID(req.body.clientId),
            startDate: new Date()
          },
          createdAt: new Date()
        };

        if (req.body.vehicleAlias) {
          insert.vehicleAlias = req.body.vehicleAlias;
        }

        return devicesCollection
          .insertOne(insert)

          .then(function (device) {
            getDeviceAggregation(devicesCollection, { id: device.insertedId }, null, null, null, function (err, devices, count) {
              db.close();

              if (err) return res.serverError(err);

              return res.created(devices[0]);
            })
          })

          .catch(function (err) {
            db.close();
            throw err;
          });
      })

      .catch(function (err) {
        return res.serverError(err);
      });
  },

  update: function (req, res) {
    var id = req.param('id');
    var clientId = ObjectID(req.body.clientId);

    MongoClient
      .connect(sails.config.connections.visionMongoDBServer.url)

      .then(function (db) {
        var devicesCollection = db.collection('devices');

        return devicesCollection
          .findOne({ _id: ObjectID(id) })

          .then(function (device) {
            if (!device) {
              db.close();
              return res.notFound();
            }

            var update = {
              $set: {
                imei: req.body.imei,
                groupId: req.body.groupId,
                firmwareVersion: req.body.firmwareVersion,
                configVersion: req.body.configVersion,
                serialNumber: req.body.serialNumber,
                updatedAt: new Date()
              }
            };

            if (req.body.vehicleAlias) {
              update.$set.vehicleAlias = req.body.vehicleAlias;
            }
            else {
              update.$unset = {
                vehicleAlias: ''
              }
            }

            if (clientId && device.currentClient && clientId.toString() != device.currentClient.id.toString()) {
              update.$set.currentClient = {
                id: clientId,
                startDate: new Date()
              };
              update.$push = {
                previousClients: {
                  id: device.currentClient.id,
                  startDate: device.currentClient.startDate,
                  endDate: new Date()
                }
              };
            }

            return devicesCollection
              .updateOne({ _id: device._id }, update)

              .then(function (data) {
                getDeviceAggregation(devicesCollection, { _id: device._id }, null, null, null, function (err, devices, count) {
                  db.close();

                  if (err) return res.serverError(err);

                  return res.ok(devices[0]);
                });
              });
          })

          .catch(function (err) {
            db.close();
            throw err;
          });
      })

      .catch(function (err) {
        return res.serverError(err);
      });
  },

  destroy: function (req, res) {
    var id = req.param('id');

    MongoClient
      .connect(sails.config.connections.visionMongoDBServer.url)

      .then(function (db) {
        var devicesCollection = db.collection('devices');

        return devicesCollection
          .deleteOne({ _id: ObjectID(id) })

          .then(function (device) {
            return res.ok();
          })

          .catch(function (err) {
            db.close();
            throw err;
          });
      })

      .catch(function (err) {
        return res.serverError(err);
      });
  }

};
