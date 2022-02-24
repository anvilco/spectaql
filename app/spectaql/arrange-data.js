const IntrospectionManipulator = require('../lib/Introspection')

const arrangeData = ({ introspectionResponse, graphQLSchema }) => {
  const introspectionManipulator = new IntrospectionManipulator(introspectionResponse)
  const queryType = introspectionManipulator.getQueryType()
  const mutationType = introspectionManipulator.getMutationType()
  const otherTypes = introspectionManipulator.getAllTypes({ includeQuery: false, includeMutation: false })

  return [
    {
      name: 'Operations',
      hideInContent: true,
      items: [
        {
          name: 'Queries',
          items: queryType.fields.map((query) => ({
            ...query,
            isQuery: true,
          })),
        },
        {
          name: 'Mutations',
          items: mutationType.fields.map((query) => ({
            ...query,
            isMutation: true,
          })),
        },
      ]
    },
    {
      name: 'Types',
      items: otherTypes,
    },
  ]
}

module.exports = arrangeData
