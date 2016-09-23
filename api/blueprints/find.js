var actionUtil = require('sails/lib/hooks/blueprints/actionUtil');

module.exports = function(req, res) {
  var Model = actionUtil.parseModel(req);
  var where = actionUtil.parseCriteria(req);

  var options = {
    limit: actionUtil.parseLimit(req),
    skip: actionUtil.parseSkip(req),
    sort: actionUtil.parseSort(req),
    where: where,
  };

  Model.find(options).exec(function(err, data) {
    if (err) {
      sails.log.error(err);
      return res.serverError(err);
    }

    Model.count(where).exec(function(err, count) {
      if (err) {
        sails.log.error(err);
        return res.serverError(err);
      }

      return res.kendoResponse(data, count);
    });
  });
}
