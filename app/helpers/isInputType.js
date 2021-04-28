// Determine if a value is a JSON-schema version of an Input Type.
// This is not a robust, super-unique check to do, but it's all about where in a
// schema it's used that makes it work properly
module.exports = (value) => {
  // {
  //   "type": "object",
  //   "properties": {
  //     "name": {
  //       "$ref": "#/definitions/String",
  //       "type": "string"
  //     },
  //     "completed": {
  //       "$ref": "#/definitions/Boolean",
  //       "type": "boolean"
  //     },
  //     "color": {
  //       "$ref": "#/definitions/Color",
  //       "default": "RED"
  //     },
  //     "pageSizes" : {
  //       "type" : "array",
  //       "items" : {
  //         "$ref" : "#/definitions/JSON"
  //       },
  //     },
  //   }
  // }
  return value && value.type === 'object' && value.properties && Object.values(value.properties).every((schema) => schema.$ref || (schema.type === 'array' && schema.items && schema.items.$ref))
}
