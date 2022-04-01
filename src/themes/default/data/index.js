import get from 'lodash/get'
import sortBy from 'lodash/sortBy'
import { Microfiber as IntrospectionManipulator } from 'microfiber'

export default ({ introspectionResponse, graphQLSchema: _graphQLSchema }) => {
  const introspectionManipulator = new IntrospectionManipulator(
    introspectionResponse
  )
  const queryType = introspectionManipulator.getQueryType()
  const mutationType = introspectionManipulator.getMutationType()
  const subscriptionType = introspectionManipulator.getSubscriptionType()
  const otherTypes = introspectionManipulator.getAllTypes({
    includeQuery: false,
    includeMutation: false,
    includeSubscription: false,
  })

  const hasQueries = get(queryType, 'fields.length')
  const hasMutations = get(mutationType, 'fields.length')
  const hasQueriesOrMutations = hasQueries || hasMutations
  const hasSubscriptions = get(subscriptionType, 'fields.length')
  const hasOtherTypes = get(otherTypes, 'length')

  return [
    hasQueriesOrMutations
      ? {
          name: 'Operations',
          hideInContent: true,
          items: [
            hasQueries
              ? {
                  name: 'Queries',
                  makeNavSection: true,
                  makeContentSection: true,
                  items: sortBy(
                    queryType.fields.map((query) => ({
                      ...query,
                      isQuery: true,
                    })),
                    'name'
                  ),
                }
              : null,
            hasMutations
              ? {
                  name: 'Mutations',
                  makeNavSection: true,
                  makeContentSection: true,
                  items: sortBy(
                    mutationType.fields.map((query) => ({
                      ...query,
                      isMutation: true,
                    })),
                    'name'
                  ),
                }
              : null,
          ],
        }
      : null,
    hasOtherTypes
      ? {
          name: 'Types',
          makeContentSection: true,
          items: sortBy(
            otherTypes.map((type) => ({
              ...type,
              isType: true,
            })),
            'name'
          ),
        }
      : null,
    hasSubscriptions
      ? {
          name: 'Subscriptions',
          makeContentSection: true,
          items: sortBy(
            subscriptionType.fields.map((type) => ({
              ...type,
              isSubscription: true,
            })),
            'name'
          ),
        }
      : null,
  ].filter(Boolean)
}
