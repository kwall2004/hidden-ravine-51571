var fs = require('fs');
var path = require('path');

module.exports = {

	find: function (req, res) {
		fs.readdir(
			'./assets/configFiles',
			function (err, files) {
				return res.json(files.map(function (value) {
					return {
						fileName: value
					}
				}));
			}
		);
	},

	create: function (req, res) {
		req.file('configFile').upload(
			{
				dirname: path.resolve('./assets/configFiles'),
				saveAs: req.file('configFile')._files[0].stream.filename
			},
			function (err, uploadedFiles) {
				if (err) {
					return res.negotiate(err);
				}

				return res.ok();
			}
		);
	}

};
