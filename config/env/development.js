/**
 * Development environment settings
 *
 * This file can include shared settings for a development team,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

module.exports = {

  /***************************************************************************
   * Set the default database connection for models in the development       *
   * environment (see config/connections.js and config/models.js )           *
   ***************************************************************************/

  connections : {
  visionMongoDBServer: {
    adapter: 'sails-mongo',
    // host: 'localhost',
    // port: 27017,
    // user: 'username', //optional
    // password: 'password', //optional
    // database: 'vision2' //optional
    url: 'mongodb://heroku_9d3ppsr0:a706flgp82q7qenmd166qmvq8d@ds051655.mlab.com:51655/heroku_9d3ppsr0'
  }},

  models: {
    connection: 'visionMongoDBServer'
  },
  port:2222,

};
