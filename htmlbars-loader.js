var path = require("path");
var HtmlbarsCompiler = require("ember-cli-htmlbars");
var loaderUtils = require("loader-utils");

var DEFAULT_TEMPLATE_COMPILER = "components-ember/ember-template-compiler.js";
var templateTree;
var appPath;
var templatesFolder;
var templateCompiler;
var newDeprecationSet = false;
var deprecationWorkflow;

/*
 * options:
 *  - appPath: default assuming webpack.config.js in root folder + ./app
 *  - templateCompiler: default 'components-ember/ember-template-compiler.js'
 */
module.exports = function (source) {
  this.cacheable && this.cacheable();
  var options = loaderUtils.getOptions(this) || {};
  var resourcePath = this.resourcePath;
  deprecationWorkflow =
    deprecationWorkflow || options.deprecationWorkflow || [];
  appPath = (options.appPath || "app").replace(/\/$/, "");
  templatesFolder = templatesFolder || path.join(appPath, "templates");
  templateCompiler =
    templateCompiler ||
    require(options.templateCompiler || DEFAULT_TEMPLATE_COMPILER);

  templateTree =
    templateTree ||
    new HtmlbarsCompiler(templatesFolder, {
      isHTMLBars: true,
      templateCompiler,
    });

  if (!newDeprecationSet) {
    newDeprecationSet = true;
    var Ember = templateCompiler._Ember;
    const originalDeprecate = Ember.deprecate;
    Ember.deprecate = function (message, test, options) {
      var noDeprecation;

      if (typeof test === "function") {
        noDeprecation = test();
      } else {
        noDeprecation = test;
      }

      let foundDeprecationHandler = false;

      if (!noDeprecation) {
        let i = -1;
        while (++i < deprecationWorkflow.length) {
          let wf = deprecationWorkflow[i];
          if (
            (options && wf.matchId && options.id === wf.matchId) ||
            (wf.matchMessage &&
              wf.matchMessage.test &&
              wf.matchMessage.test(message)) ||
            wf.matchMessage === message
          ) {
            switch (wf.handler || "log") {
              case "log":
                console.log(
                  "DEPRECATION: Message:",
                  message,
                  "Options:",
                  options,
                  "File:",
                  resourcePath
                );
                break;
              case "throw":
                throw new Error(message);
              case "silence":
                break;
            }

            foundDeprecationHandler = true;
            break;
          }
        }
      }

      if (!foundDeprecationHandler) {
        return originalDeprecate.apply(this, arguments);
      }

      return options;
    };
  }

  var resourcePathMatcher = new RegExp(`${templatesFolder}/(.*)\\.[^.]+$`);
  var templateMatch = resourcePath.match(resourcePathMatcher);
  var templatePath = templateMatch.pop();

  var fullTemplate = templateTree.processString(source, templatePath);
  var templateString = fullTemplate.replace(
    /^export default Ember\./,
    "Ember."
  );
  return 'Ember.TEMPLATES["' + templatePath + '"] = ' + templateString;
};
