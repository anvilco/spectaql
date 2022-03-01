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
          makeNavSection: true,
          makeContentSection: true,
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
          makeNavSection: true,
          makeContentSection: true,
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
      makeContentSection: true,
      items: sortBy(
        otherTypes.map((type) => ({
          ...type,
          isType: true,
        })),
      'name'),
    },
  ]
}

module.exports = arrangeData
