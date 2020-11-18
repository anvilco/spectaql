/**
 * Accepts a bunch of inforamtion about a Field, and allows you to return an example
 * to be used in your documentation. If undefined is returned, a default example will
 * be used for you.
 *
 * @param  {Object} argz An object containing the following properties to help you generate your example:
 *    {String} parentName - The name of the Type this Field is part of
 *
 *    {String} name - The name of this Field
 *    {String} returnType - The return Type of the Field
 *    {Object} definition - The JSON Schema definition for this Field
 *
 *    {Boolean} isArray - Boolean indicating if the return Type is an array/list
 *    {Boolean} itemsRequired - Boolean indicating if the items in the array/list are required
 *
 *    {Object} args - All of the arguments originally passed to the augmentation method:
 *      {Object} introspectionResponse - The introspection query response Object
 *      {Object} jsonSchema - The JSON Schema representing the entire GraphQL Schema
 *      {Object} graphQLSchema - The GraphQL schema object
 *      {introspectionOptions} - Options from the CLI and YML related to generating the documentation
 *
 * @return {Any} The value to use as an example. Return undefined to just use the default.
 */
function fieldProcessor (argz = {}) {
  const {
    parentName,
    name,
    returnType,
    isArray,
  } = argz

  // All String fields of MyType get an example
  if (parentName === 'MyType' && returnType === 'String') {
    const val = `Generated Field example for ${name}`
    // Might need to be an array
    return isArray ? [val] : val
  }
}


/**
 * Accepts a bunch of inforamtion about an Argument, and allows you to return an example
 * to be used in your documentation. If undefined is returned, a default example will
 * be used for you.
 *
 * @param  {Object} argz - An object containing the following properties to help you generate your example:
 *    {Enum of String} grandParentType - If the Argument is on a Field, this will be "Type". Otherise,
 *      the Argument is from a Query or Mutation and it will indicate "Query" or "Mutation".
 *    {String} grandParentName - If the Argument is on a Field, this will list the name of the Type that
 *      the Field is part of. Otherise, the Argument is from a Query or Mutation and it will indicate
 *      "Query" or "Mutation".
 *
 *    {Enum of String} parentType - If the Argument is on a Field, this will be "Field". Otherise,
 *      the Argument is from a Query or Mutation and it will indicate "Query" or "Mutation".
 *    {String} parentName - The name of the Field, Query or Mutation this Argument is on.
 *    {Object} parentDefinition - The JSON Schema definition for the parent of this Argument
 *
 *    {String} name - The name of this Argument
 *    {Object} definition - The JSON Schema definition for this Argument
 *    {String} type - The Type of this Argument
 *
 *    {Boolean} isArray - Boolean indicating if the return Type is an array/list
 *    {Boolean} itemsRequired - Boolean indicating if the items in the array/list are required
 *    {Object} args - All of the arguments originally passed to the augmentation method:
 *      {Object} introspectionResponse - The introspection query response Object
 *      {Object} jsonSchema - The JSON Schema representing the entire GraphQL Schema
 *      {Object} graphQLSchema - The GraphQL schema object
 *      {introspectionOptions} - Options from the CLI and YML related to generating the documentation
 *
 * @return {Any} The value to use as an example. Return undefined to just use the default.
 */
function argumentProcessor (argz = {}) {
  const {
    parentType,
    parentName,
    name,
    type,
    isArray,
  } = argz

  // All String arguments of the myQuery Query get examples
  if (parentType === 'Query' && parentName === 'myQuery' && type === 'String') {
    const val = `Special generated Argument example for ${parentName} ${name}`
    // Might need to be an array
    return isArray ? [val] : val
  }

  // All String arguments everywhere get examples
  if (type === 'String') {
    const val = `Generated Argument example for ${parentName} ${name}`
    // Might need to be an array
    return isArray ? [val] : val
  }
}

module.exports = {
  fieldProcessor,
  argumentProcessor,
}
