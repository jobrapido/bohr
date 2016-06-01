var fs = require('fs');


/**
 * @param {*} obj
 * @return {*}
 */
var cloneObject = function(obj) {
  var clone = {};

  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      clone[key] = obj[key];
    }
  }
  return clone;
};



/**
 * Utility class for parsing
 *
 * @constructor
 *
 * @param {Object=} opt_baseConfig
 */
ConfigBuilder = function(opt_baseConfig) {

  /**
   * @type {Object}
   * @private
   */
  this.config_ = cloneObject(opt_baseConfig || {});

  /**
   * @type {string}
   * @private
   */
  this.prefix_ = '';
};


/**
 * @return {Object}
 */
ConfigBuilder.prototype.build = function() {
  return this.config_;
};


/**
 *
 * The prefix for which we want to expose the configurations. Defaults to ''
 *
 * @param {string} prefix
 * @return {ConfigBuilder}
 */
ConfigBuilder.prototype.setAllowedPrefix = function(prefix) {
  this.prefix_ = prefix;
  return this;
};


/**
 * Parses a configuration file and overwrites config
 *
 * @param {string} path
 * @return {ConfigBuilder}
 */
ConfigBuilder.prototype.parseConfigurationFile = function(path) {

  /** @type {string} */
  var fileBuf = fs.readFileSync(path, 'utf8');

  /** @type {Object} */
  var config = JSON.parse(fileBuf);

  ConfigBuilder.objectExtend_(this.config_, config);
  return this;
};


/**
 * @return {ConfigBuilder}
 */
ConfigBuilder.prototype.parseEnvironmentArguments = function() {
  for (var property in process.env) {
    if (process.env.hasOwnProperty(property)) {
      var argument = /** @type {string} */ (process.env[property]);

      /** @type {string} */
      var fullPrefix = this.prefix_.toUpperCase();

      if (property.indexOf(fullPrefix) == 0) {

        /** @type {Object} */
        var config = this.buildObjectTree_(property.replace('_', '.')
            .toLowerCase(), argument);

        if (!config) {
          continue;
        }
        ConfigBuilder.objectExtend_(this.config_, config);
      }
    }
  }
  return this;
};


/**
 * @return {ConfigBuilder}
 */
ConfigBuilder.prototype.parseCommandlineArguments = function() {

  for (var i = 0; i < process.argv.length; i++) {
    /** @type {string} */
    var argument = process.argv[i];

    /** @type {string} */
    var fullPrefix = '--' + this.prefix_;

    if (argument.indexOf(fullPrefix) === 0) {

      /** @type {Array.<string>} */
      var splitted = argument.split('=');

      /** @type {string} */
      var fqn = splitted.shift()
          .replace('--', '');

      /** @type {string} */
      var value = splitted.shift();

      /** @type {Object} */
      var config = this.buildObjectTree_(fqn, value);

      if (!config) {
        continue;
      }
      ConfigBuilder.objectExtend_(this.config_, config);
    }
  }
  return this;
};


/**
 * Deep copies an object.
 * The current property is transversed ONLY if is an object.
 * Every other type will be overwritten
 *
 * @param {Object} target
 * @param {Object} source
 * @return {Object}
 *
 * @private
 */
ConfigBuilder.objectExtend_ = function(target, source) {
  for (var property in source) {
    if (source.hasOwnProperty(property)) {
      if (ConfigBuilder.isObject_(target[property])) {
        ConfigBuilder.objectExtend_(target[property], source[property]);
      } else {
        target[property] = source[property];
      }
    }
  }
  return target;
};


/**
 * Checks if a variable is an object
 *
 * @param {*} v
 * @return {boolean}
 * @private
 */
ConfigBuilder.isObject_ = function(v) {
  var type = typeof v;
  return type == 'object' && v != null || type == 'function';
};


/**
 * Tries to auto-cast a string to a boolean or number
 *
 * @param {string} value
 * @return {string|number|boolean}
 * @private
 */
ConfigBuilder.prototype.tryCastStringValue_ = function(value) {

  /** @type {string|number} */
  var converted = parseInt(value, 10) || value;

  if (value === 'true') {
    converted = true;
  }

  if (value === 'false') {
    converted = false;
  }
  return converted;
};


/**
 * Builds an object tree based on a string containing a full qualified name.
 * It assign the value optional opt_value arguments
 *
 * @param {string} fqn
 * @param {string=} opt_value
 * @return {Object}
 * @private
 */
ConfigBuilder.prototype.buildObjectTree_ = function(fqn, opt_value) {

  /** @type {?string} */
  var value = opt_value || null;

  /** @type {Object} */
  var root = {};

  /** @type {Object} */
  var rootCurrent = root;

  /** @type {Array.<string>} */
  var parts = fqn.split('.');

  for (var i = 0; i < parts.length; i++) {

    /** @type {string} */
    var current = parts[i];

    if (current && current.length > 0) {
      if (!rootCurrent[current]) {

        if (i === parts.length - 1) {
          rootCurrent[current] = this.tryCastStringValue_(value);
        } else {
          rootCurrent[current] = {};
        }
        rootCurrent = rootCurrent[current];
      }
    }
  }
  return root;
};


/** @type {ConfigBuilder} */
module.exports = ConfigBuilder;

