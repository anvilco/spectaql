const get = require('lodash/get')
const sortBy = require('lodash/sortBy')
const IntrospectionManipulatorModule = require('microfiber')
const {
  default: IntrospectionManipulator,
} = IntrospectionManipulatorModule

const arrangeData = ({ introspectionResponse, graphQLSchema }) => {
  const introspectionManipulator = new IntrospectionManipulator(introspectionResponse)
  const queryType = introspectionManipulator.getQueryType()
  const mutationType = introspectionManipulator.getMutationType()
  const otherTypes = introspectionManipulator.getAllTypes({ includeQuery: false, includeMutation: false })

  const hasQueries = get(queryType, 'fields.length')
  const hasMutations = get(mutationType, 'fields.length')
  const hasQueriesOrMutations = hasQueries || hasMutations
  const hasOtherTypes = get(otherTypes, 'length')

  return [
    hasQueriesOrMutations ? {
      name: 'Operations',
      hideInContent: true,
      items: [
         hasQueries ? {
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
        } : null,
        hasMutations ? {
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
        } : null,
      ]
    } : null,
    hasOtherTypes ? {
      name: 'Types',
      makeContentSection: true,
      items: sortBy(
        otherTypes.map((type) => ({
          ...type,
          isType: true,
        })),
      'name'),
    } : null,
  ].filter(Boolean)
}

module.exports = arrangeData
