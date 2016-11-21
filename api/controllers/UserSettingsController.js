/**
 * UserSettingsController
 *
 * @description :: Server-side logic for managing userSettings
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var actionUtil = require('sails/lib/hooks/blueprints/actionUtil');

module.exports = {

	destroy: function (req, res) {
		var Model = actionUtil.parseModel(req);
		var where = actionUtil.parseCriteria(req);
		var pk = actionUtil.parsePk(req);

		Model.destroy(where || pk)
			.then(function () {
				return res.ok();
			})

			.catch(function (err) {
				return res.serverError(err);
			});
	}
};
