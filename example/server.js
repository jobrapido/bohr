var server = require('../lib/Bohr');

/** @type {Object} */
var serverConfiguration = new server.Config({})
  .parseConfigurationFile(__dirname + '/conf/server.json')
  .parseCommandlineArguments()
  .build();

/** @type {Object} */
var browserConfiguration = new server.Config({})
  .setAllowedPrefix('browser')
  .parseEnvironmentArguments()
  .parseConfigurationFile(__dirname + '/conf/browser.json')
  .parseCommandlineArguments()
  .build();

/** @type {ApplicationServer} */
new server.Server(serverConfiguration, browserConfiguration).run();
