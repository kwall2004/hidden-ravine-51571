var actionUtil = require('sails/lib/hooks/blueprints/actionUtil');
var _ = require('lodash');

module.exports = function (req, res) {

  var Model = actionUtil.parseModel(req);
  var where = actionUtil.parseCriteria(req);

  var query = Model.find()
    .where(where)
    .limit(actionUtil.parseLimit(req))
    .skip(actionUtil.parseSkip(req))
    .sort(actionUtil.parseSort(req));
  query = actionUtil.populateRequest(query, req);
  query
    .then(function (data) {
      return [data, Model.count(where)];
    })

    .spread(function (data, count) {
      return res.visionResponse(data, count, 200);
    })

    .catch(function (err) {
      return res.serverError(err);
    });

}
