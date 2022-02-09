const fs = require('fs')
const p = require('path');
const yaml = require('js-yaml');


module.exports = function (path) {
  const extendedSchema = yaml.DEFAULT_SCHEMA.extend({
    explicit: [
      new yaml.Type('!file', { kind: 'scalar', construct: function (relPath) { return fs.readFileSync(p.join(p.dirname(path), relPath), "utf8") }})
    ]
  });
  const fileContent = fs.readFileSync(path, "utf8")
  return yaml.load(fileContent, { schema: extendedSchema, filename: path })
}