var server = require('../lib/Bohr');

/** @type {Object} */
var serverConfiguration = new server.Config({})
  .setAllowedPrefix('server')
  .parseConfigurationFile(__dirname + '/conf/server.json')
  .parseEnvironmentArguments()
  .parseCommandlineArguments()
  .build();

/** @type {Object} */
var browserConfiguration = new server.Config({})
  .setAllowedPrefix('browser')
  .parseConfigurationFile(__dirname + '/conf/browser.json')
  .parseEnvironmentArguments()
  .parseCommandlineArguments()
  .build();

/** @type {ApplicationServer} */
new server.Server(serverConfiguration, browserConfiguration).run();
