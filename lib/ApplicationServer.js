var express = require('express');
var cheerio = require('cheerio');
var proxy = require('http-proxy-middleware');
var fs = require('fs');
var _ = require('lodash');



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
    return next();
  }

  /** @type {string} */
  var staticPath = _.get(this.config_, 'server.staticPath');

  /** @type {string} */
  var indexFile = _.get(this.config_, 'server.indexHtmlFile');


  fs.readFile('./' + staticPath + indexFile, 'utf8', (function(err, data) {
    if (!err) {
      var responseText = this.patchResponse_(data);
      incomingMessage.res.send(responseText);
    } else {
      console.log(err);
      incomingMessage.res.send(err.toString());
    }
  }).bind(this));
};


/**
 * Runs the server
 *
 * @return {ApplicationServer}
 */
ApplicationServer.prototype.run = function() {
  console.log("Server starting...");

  /* Configure proxies */
  if (_.has(this.config_, 'server.proxy')) {
    console.log("Loading proxy configurations...");
    var proxyCfgs = _.get(this.config_, 'server.proxy');
    for (var proxyName in proxyCfgs) {
      if (!proxyCfgs.hasOwnProperty(proxyName)) { continue; }
      var proxyCfg = proxyCfgs[proxyName];
      if (proxyCfg && proxyCfg.base) {
        console.log("Valid proxy configuration " + JSON.stringify(proxyCfg) + " found, loading");
        this.express_.use(proxy(proxyCfg.base, proxyCfg));
      } else {
        console.error("Invalid proxy configuration " + JSON.stringify(proxyCfg + " found, skipping"));
      }
    }
  }

  if (_.get(this.config_, 'server.cors.enabled', false)) {
    this.express_.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });
  }

  /* Serve static assets */
  this.express_.use(express.static('./' +
      _.get(this.config_, 'server.staticPath'), {
        index: false
      }));
  
  /* Route every other request to index.html */
  this.express_.use(this.patchHtmlMiddleware_.bind(this));

  this.express_.use((req, res, next) => {
    res.status(404).send('Not found'); // no handler can manage the request
  });

  this.express_.listen(this.config_.server.port);

  console.log("Server started, listening on port " + this.config_.server.port);
  return this;
};


/** @type {ApplicationServer} */
module.exports = ApplicationServer;
