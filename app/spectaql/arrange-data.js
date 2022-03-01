const sortBy = require('lodash/sortBy')
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
          items: sortBy(
            queryType.fields.map((query) => ({
              ...query,
              isQuery: true,
            })),
            'name',
          ),
        },
        {
          name: 'Mutations',
          items: sortBy(
            mutationType.fields.map((query) => ({
              ...query,
              isMutation: true,
            })),
            'name',
          ),
        },
      ]
    },
    {
      name: 'Types',
      items: sortBy(otherTypes, 'name'),
    },
  ]
}

module.exports = arrangeData
