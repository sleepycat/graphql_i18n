const express = require('express')
const graphqlHTTP = require('express-graphql')
const { GraphQLSchema, GraphQLObjectType, GraphQLString } = require('graphql')
// We are renaming i18n here to avoid shadowing variables.
// babel-plugin-lingui-transform-js will look for occurances of i18n.t`` and convert them to i18n._('')
// so we import it here under the name internationalization and rename to what
// the babel plugin expects when we pass it to the function that creates our
// schema
const { i18n: internationalization, unpackCatalog } = require('lingui-i18n')
const requestLanguage = require('express-request-language')

internationalization.load({
  fr: unpackCatalog(require('./locale/fr/messages.js')),
  en: unpackCatalog(require('./locale/en/messages.js')),
})

// Any use of i18n.t will be found by lingui babel plugins and converted to the low level function call API:
const createSchema = i18n => {
  // Define a type that describes the data
  const DateTime = new GraphQLObjectType({
    name: 'DateTime',
    description: i18n.t`An example date/time object`,
    fields: () => ({
      date: {
        description: i18n.t`the current date in DD/MM/YYYY format`,
        type: GraphQLString,
      },
      time: {
        description: i18n.t`the current time in HH:MM:SS AM/PM format`,
        type: GraphQLString,
      },
    }),
  })

  const query = new GraphQLObjectType({
    name: 'Query',
    fields: {
      now: {
        description: i18n.t`Returns current time and date values`,
        type: DateTime, // what the resolve function will produce
        resolve: (root, args, context) => {
          let now = new Date()
          let time = now.toLocaleDateString(context.language, {
            timeZone: 'America/Toronto',
          })
          let date = now.toLocaleTimeString(context.language, {
            timeZone: 'America/Toronto',
          })
          return { date, time }
        },
      },
    },
  })

  return query
}

let server = express()

server
  .use(
    requestLanguage({
      // First locale becomes the default so we sort to make sure en is default:
      languages: internationalization.availableLanguages.sort(),
    }),
  )
  .use(
    '/graphql',
    graphqlHTTP(async (request, response, graphQLParams) => {
      // requestLanguage has chosen one of our provided languages and attached
      // it to the request as request.language. Now we tell lingui to use it:
      internationalization.activate(request.language)
      return {
        schema: new GraphQLSchema({
          // Now that we know the language and have setup lingui we can create
          // our schema with the proper doc strings:
          query: createSchema(internationalization),
        }),
        graphiql: true,
      }
    }),
  )

server.listen(3000)
