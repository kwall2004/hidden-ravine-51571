/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var actionUtil = require('sails/lib/hooks/blueprints/actionUtil');

module.exports = {
	find(req, res) {
		var Model = actionUtil.parseModel(req);

		var query = Model.find()
			.where(actionUtil.parseCriteria(req))
			.limit(actionUtil.parseLimit(req))
			.skip(actionUtil.parseSkip(req))
			.sort(actionUtil.parseSort(req));

		query = actionUtil.populateRequest(query, req);
		query.exec(function (error, records) {
			if (error) {
				return res.serverError(error);
			}

			Model.count(actionUtil.parseCriteria(req))
			.exec(function (error, total) {
				if (error) {
					return res.serverError(error);
				}

				var data = {};
				data.total = total;
				data.records = records;

				return res.ok(data);
			});
		});
	}
};
