var path = require("path");
var HtmlbarsCompiler = require("ember-cli-htmlbars");

var DEFAULT_TEMPLATE_COMPILER = "components-ember/ember-template-compiler.js";
var templateTree;
var appPath;
var templatesFolder;

/*
 * options:
 *  - appPath: default assuming webpack.config.js in root folder + ./app
 *  - templateCompiler: default 'components-ember/ember-template-compiler.js'
 */
module.exports = function (source) {
  var options = this.getOptions();
  appPath = appPath || (options.appPath || "app").replace(/\/$/, "");
  templatesFolder = templatesFolder || path.join(appPath, "templates");

  templateTree =
    templateTree ||
    new HtmlbarsCompiler(templatesFolder, {
      isHTMLBars: true,
      templateCompiler: require(options.templateCompiler ||
        DEFAULT_TEMPLATE_COMPILER),
    });

  var resourcePathMatcher = new RegExp(`${templatesFolder}/(.*)\\.[^.]+$`);
  var templateMatch = this.resourcePath.match(resourcePathMatcher);
  var templatePath = templateMatch.pop();

  var fullTemplate = templateTree.processString(source, templatePath);
  var templateString = fullTemplate.replace(
    /^export default Ember\./,
    "Ember."
  );
  return 'Ember.TEMPLATES["' + templatePath + '"] = ' + templateString;
};
