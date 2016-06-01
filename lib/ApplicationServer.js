var express = require('express');
var cheerio = require('cheerio');
var fs = require('fs');



/**
 * The application server
 *
 * @constructor
 *
 * @param {Object} serverConfig
 * @param {Object} browserConfig
 */
var ApplicationServer = function(serverConfig, browserConfig) {
  /**
   * @type {Object}
   * @private
   */
  this.config_ = serverConfig;

  /**
   * @type {Object}
   * @private
   */
  this.browserConfig_ = browserConfig;

  /**
   * The express server
   *
   * @private
   */
  this.express_ = express();
};


/**
 *
 * @return {string}
 * @private
 */
ApplicationServer.prototype.buildScript_ = function() {
  /**
   * @type {string}
   */
  var injectedConfig = JSON.stringify(this.browserConfig_);

  /**
   * @type {Array.<string>}
   */
  var script = [
    '<script>',
    '(function(w){ w.browserConfig_=' + injectedConfig + ' })(window);',
    '</script>',
    '\n'
  ];
  return script.join('');
};


/**
 * Patches the html file content
 *
 * @param {string} htmlContent
 * @private
 *
 * @return {string}
 */
ApplicationServer.prototype.patchResponse_ = function(htmlContent) {
  /** @type {string} */
  var script = this.buildScript_();

  var dom = cheerio.load(htmlContent);
  var firstScript = dom('script')[0];

  dom(script).insertBefore(firstScript);

  return dom.html();
};


/**
 * A middleware that patches html index file
 *
 * @param {IncomingMessage} incomingMessage
 * @param {ServerResponse} serverResponse
 * @param {function():void} next
 * @private
 */
ApplicationServer.prototype.patchHtmlMiddleware_ =
    function(incomingMessage, serverResponse, next) {
  var path = /** @type {string} */(incomingMessage.path);

  if (path !== '/') {
    next();
  }

  /** @type {string} */
  var staticPath = this.config_['server']['staticPath'];

  /** @type {string} */
  var indexFile = this.config_['server']['indexHtmlFile'];


  fs.readFile('./' + staticPath + indexFile, 'utf8', (function(err, data) {
    if (!err) {
      var responseText = this.patchResponse_(data);
      incomingMessage.res.send(responseText);
    } else {
      console.log(err);
      incomingMessage.res.send(err.toString());
    }
  })
      .bind(this));
};


/**
 * Runs the server
 *
 * @return {ApplicationServer}
 */
ApplicationServer.prototype.run = function() {
  /* Serve static assets */
  this.express_.use(express.static('./' +
      this.config_['server']['staticPath'], {
        index: false
      }));

  /* Route every other request to index.html */
  this.express_.use(this.patchHtmlMiddleware_.bind(this));

  this.express_.listen(this.config_.server.port);
  return this;
};


/** @type {ApplicationServer} */
module.exports = ApplicationServer;
