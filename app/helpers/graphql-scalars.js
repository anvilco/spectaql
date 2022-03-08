const GraphQLScalar = require('graphql-scalars');

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


// Map GraphQL Scalar types to example data to use from them
const GRAPHQL_SCALAR_TO_EXAMPLE = {
  BigInt: [GraphQLScalar.BigIntMock()],
  Byte:  [GraphQLScalar.ByteMock()],
  Time:  [GraphQLScalar.TimeMock()],
  Timestamp:  [GraphQLScalar.TimestampMock()],
  DateTime:  [GraphQLScalar.DateTimeMock()],
  UtcOffset: [GraphQLScalar.UtcOffsetMock()],
  Duration: [GraphQLScalar.DurationMock()],
  ISO8601Duration:  [GraphQLScalar.ISO8601DurationMock()],
  LocalDate: [GraphQLScalar.LocalDateMock()],
  LocalTime: [GraphQLScalar.LocalTimeMock()],
  LocalEndTime: [GraphQLScalar.LocalEndTimeMock()],
  EmailAddress: [GraphQLScalar.EmailAddressMock()],
  UUID: [GraphQLScalar.UUIDMock()],
  Hexadecimal: [GraphQLScalar.HexadecimalMock()],
  HexColorCode: [GraphQLScalar.HexColorCodeMock()],
  HSL: [GraphQLScalar.HSLMock()],
  HSLA:[GraphQLScalar.HSLAMock()],
  IBAN: [GraphQLScalar.IBANMock()],
  IPv4 :[GraphQLScalar.IPv4Mock()],
  IPv6:[GraphQLScalar.IPv6Mock()],
  ISBN :[GraphQLScalar.ISBNMock()],
  JWT : [GraphQLScalar.JWTMock()],
  Latitude : [GraphQLScalar.LatitudeMock()],
  Longitude: [GraphQLScalar.LongitudeMock()],
  JSONObject: [GraphQLScalar.JSONObjectMock()],
  MAC: [GraphQLScalar.MACMock()],
  NegativeFloat: [GraphQLScalar.NegativeFloatMock()],
  NegativeInt: [GraphQLScalar.NegativeIntMock()],
  NonEmptyString: [GraphQLScalar.NonEmptyStringMock()],
  NonNegativeFloat: [GraphQLScalar.NonNegativeFloatMock()],
  NonNegativeInt: [GraphQLScalar.NonNegativeIntMock()],
  NonPositiveFloat : [GraphQLScalar.NonPositiveFloatMock()],
  NonPositiveInt: [GraphQLScalar.NonPositiveIntMock()],
  PhoneNumber: [GraphQLScalar.PhoneNumberMock()],
  Port: [GraphQLScalar.PortMock()],
  PositiveFloat : [GraphQLScalar.PositiveFloatMock()],
  PositiveInt: [GraphQLScalar.PositiveIntMock()],
  PostalCode: [GraphQLScalar.PostalCodeMock()],
  RGB: [GraphQLScalar.JSONObjectMock()],
  RGBA: [GraphQLScalar.RGBAMock()],
  SafeInt: [GraphQLScalar.SafeIntMock()],
  URL: [GraphQLScalar.URLMock()],
  USCurrency: [GraphQLScalar.USCurrencyMock()],
  Currency: [GraphQLScalar.CurrencyMock()],
  UnsignedFloat: [GraphQLScalar.UnsignedFloatMock()],
  UnsignedInt: [GraphQLScalar.UnsignedIntMock()],
  GUID: [GraphQLScalar.GUIDMock],
  ObjectID: [GraphQLScalar.ObjectIDMock]
}

function getExampleForGraphQLScalar (scalarName) {
  return  GRAPHQL_SCALAR_TO_EXAMPLE[scalarName];
}

function isGraphQLScalar  (value)  {
  // "EmailAddress": {
  //   "type": "string",
  //   "title": "String",
  //   "description": "The `EmailAddress` scalar type represents email, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text."
  // },

  // All Scalars will have a "title"
  return !!value && value.title && (GRAPHQL_SCALAR_MAP[value.title] && GRAPHQL_SCALAR_MAP[value.title] === value.type);
}

module.exports = { getExampleForGraphQLScalar, isGraphQLScalar };
