// Determine if a value is a JSON-schema version of a Scalar

// These are the GraphQL default scalars that map to JSON Schema types
const DEFAULT_SCALARS_MAP = {
  Boolean: 'boolean',
  String: 'string',
  Int: 'number',
  Float: 'number',
  ID: 'string',
}

//https://github.com/Urigo/graphql-scalars/blob/master/src/typeDefs.ts
const GRAPHQL_SCALAR_MAP = {
  BigInt: 'number',
  Byte: 'string',
  Date: 'string',
  Time: 'string',
  Timestamp: 'string',
  DateTime: 'string',
  UtcOffset: 'string',
  Duration: 'string',
  ISO8601Duration: 'string',
  LocalDate: 'string',
  LocalTime: 'string',
  LocalEndTime: 'string',
  EmailAddress: 'string',
  UUID: 'string',
  Hexadecimal: 'string',
  HexColorCode: 'string',
  HSL: 'string',
  HSLA: 'string',
  IBAN: `string`,
  IPv4: `string`,
  IPv6: `string`,
  ISBN: `string`,
  JWT: `string`,
  Latitude: `string`,
  Longitude: `string`,
  JSON: `object`,
  JSONObject : 'object',
  MAC: 'string',
  NegativeFloat : 'number',
  NegativeInt : 'number',
  NonEmptyString : 'string',
  NonNegativeFloat : 'number',
  NonNegativeInt: 'number',
  NonPositiveFloat : 'number',
  NonPositiveInt : 'number',
  PhoneNumber : 'string',
  Port : 'number',
  PositiveFloat : 'string',
  PositiveInt : 'number',
  PostalCode : 'string',
  RGB : 'string',
  RGBA : 'string',
  SafeInt : 'number',
  URL: 'string',
  USCurrency : 'string',
  Currency : 'string',
  UnsignedFloat: 'string',
  UnsignedInt: 'string',
  GUID: 'string',
  ObjectID: 'string',
}

module.exports = (value) => {
  // "String": {
  //   "type": "string",
  //   "title": "String",
  //   "description": "The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text."
  // },
  // "Boolean": {
  //   "type": "boolean",
  //   "title": "Boolean",
  //   "description": "The `Boolean` scalar type represents `true` or `false`."
  // },
  // "DateTime": {
  //   "description": "A custom scalar will look like this.",
  //   "type": "object",
  //   "title": "DateTime",
  // },

  // All Scalars will have a "title"
  return !!value && value.title && (
    // GraphQL default scalars will obey this pattern
    (DEFAULT_SCALARS_MAP[value.title] && DEFAULT_SCALARS_MAP[value.title] === value.type)
    ||
    // graphql-scalars will obey this pattern
    (GRAPHQL_SCALAR_MAP[value.title] && GRAPHQL_SCALAR_MAP[value.title] === value.type)
    ||
    // Custom scalars will be "object"
    (value.type === 'object')
  )
}
