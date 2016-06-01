README
=======
A simple static server that accepts json files or command line args as configuration properties and makes them available
to the javascript runtime through the injection of a script on the index html file.

The exposed configuration is available to javascript via the global **window.browserConfig_** object

The server accepts two configuration objects. One for the server (eg. ports, static assets paths,etc) and one for the 
for the browser. We avoid to mix and match because otherwise would be easy to expose sensitive configurations 
to the public internet. 

Note that you **must** provide a basic server config for port, static asset path and index file to serve, eg.:
```
{
  "server": {
    "port": 9001,
    "staticPath": "/static/",
    "indexHtmlFile": "index.html"
  }
}
```


Configuration builder
-------
A configuration builder with a fluent interface is provided to help with the parsing of command line and environment 
arguments. 

It also supports filtering arguments by a given prefix.

Supported sources for the config builder are:

- Initial javascript object
- Json file on the filesystem
- Command line arguments in the form of "--key=value"
- Environment variables

Note: The keys produced by the configuration builder have "depth". For example both an environment variable like 
BROWSER_CATEGORY_DETAIL=example and a command line variable like --browser.category.detail=example will produce a nested
object like this:

```
{
  browser : {
    category: {
      detail : 'example'
    }
  }
}
```

Where possible the configuration builder will cast the variables to javascript primitives, for example --a=true will be 
casted to a boolean and --a=1 will be casted to number.

Install from npm
-------
```
npm install bohr
```

Example Usage
-------
```
var server = require('../lib/Server');

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

```