const path = require('path')
const _ = require('lodash')

var httpMethods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', '$ref'];

const tagToQueryOrMutation = {
  'Queries': 'Query',
  'Mutations': 'Mutation',
}

// Preprocessor for the Swagger JSON so that some of the logic can be taken
// out of the template.

module.exports = function(options, specData, { jsonSchema } = {}) {
  if (!options.specFile) {
    console.warn("[WARNING] preprocessor must be given 'options.specFile'.  Defaulting to 'cwd'.")
    options.specFile = process.cwd()
  }

  // Don't normalize x-spec-path to posix path. It must be a platform specific.
  specData["x-spec-path"] = options.specFile;

  var copy = _.cloneDeep(specData)
  // "tags" will be "Query" or "Mutation", and all of the individual queries or mutations
  // will be jammed onto the tag in an "operations" array.
  // var tagsByName = _.keyBy(copy.tags, 'name')

  // copy.tags = copy.tags || [];

  if (options.logoFileTargetName) {
    copy.logo = path.basename(options.logoFileTargetName)
  }

  if (options.faviconFileTargetName) {
    copy.favicon = path.basename(options.faviconFileTargetName)
  }

  // The "body"-parameter in each operation is stored in a
  // separate field "_request_body".
  // if (copy.paths) {
  //   copy.paths.forEach(function(path) {
  //     var pathParameters = path.parameters || []
  //     Object.keys(path).forEach(function(method) {
  //       if (httpMethods.indexOf(method) < 0) {
  //         delete path[method]
  //         return
  //       }
  //       var operation = path[method]
  //       operation.path = operation.operationId
  //       operation.method = method
  //       // Draw links from tags to operations referencing them
  //       var operationTags = operation.tags || ['default']

  //       operationTags.forEach(function(tag) {
  //         if (!tagsByName[tag]) {
  //           // New implicit declaration of tag not defined in global "tags"-object
  //           // https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md#user-content-swaggerTags
  //           const tagDefinition = {
  //             name: tag,
  //             operations: []
  //           }

  //           const queryOrMutationPropertyName = tagToQueryOrMutation[tag]

  //           if (queryOrMutationPropertyName) {
  //             const queryOrMutationDescription = _.get(jsonSchema, `properties.${queryOrMutationPropertyName}.description`)
  //             if (queryOrMutationDescription) {
  //               tagDefinition.description = queryOrMutationDescription
  //             }
  //           }

  //           tagsByName[tag] = tagDefinition
  //           copy.tags.push(tagDefinition)
  //         }
  //         if (tagsByName[tag]) {
  //           tagsByName[tag].operations = tagsByName[tag].operations || []
  //           tagsByName[tag].operations.push(operation)
  //         }
  //       })

  //       // Join parameters with path-parameters
  //       //
  //       // Filter out the 'body' parameter from the rest of them, and stuff it into the _request_body
  //       // key. Weird.
  //       operation.parameters = (operation.parameters || [])
  //         .concat(pathParameters)
  //         .filter(function(param) {
  //           if (param.in === 'body') {
  //             operation._request_body = param
  //             return false
  //           }
  //           return true
  //         })
  //       // Show body section, if either a body-parameter or a consumes-property is present.
  //       operation._show_requst_body_section = true
  //     })
  //   })
  //   // If there are multiple tags, we show the tag-based summary
  //   copy.showTagSummary = copy.tags.length > 1

  //   // Sort "operations" (read: queries or mutations) by their name
  //   Object.values(tagsByName).forEach((tag) => {
  //     if (Array.isArray(tag.operations)) {
  //       tag.operations = _.sortBy(tag.operations, 'path')
  //     }
  //   })
  // }

  // var replaceRefs = require("./resolve-references").replaceRefs;
  // replaceRefs(path.dirname(copy["x-spec-path"]), copy, copy, "")

  // if (copy.definitions) {
  //   var names = Object.keys(copy.definitions);
  //   names.sort();
  //   var sortedDefinitions = {};
  //   for (const name of names) {
  //     sortedDefinitions[name] = copy.definitions[name];
  //   }
  //   copy.definitions = sortedDefinitions;
  // }

  return copy;
}

module.exports.httpMethods = httpMethods;
