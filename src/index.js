const express = require('express')
const graphqlHTTP = require('express-graphql')
const { GraphQLSchema, GraphQLObjectType, GraphQLString } = require('graphql')
const { i18n: internationalization, unpackCatalog } = require('lingui-i18n')
const requestLanguage = require('express-request-language')

internationalization.load({
  fr: unpackCatalog(require('./locale/fr/messages.js')),
  en: unpackCatalog(require('./locale/en/messages.js')),
})

const createSchema = i18n => {
  // Define a type that describes the data
  const DateTime = new GraphQLObjectType({
    name: 'DateTime',
    description: i18n.t`An example date/time object.`,
    fields: () => ({
      date: {
        description: i18n.t`The current date in DD/MM/YYYY format.`,
        type: GraphQLString,
      },
      time: {
        description: i18n.t`The current time in HH:MM:SS AM/PM format.`,
        type: GraphQLString,
      },
    }),
  })

  const query = new GraphQLObjectType({
    name: 'Query',
    fields: {
      now: {
        description: i18n.t`Returns current time and date values.`,
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
      languages: internationalization.availableLanguages.sort(), // First locale becomes the default
    }),
  )
  .use(
    '/graphql',
    graphqlHTTP(async (request, response, graphQLParams) => {
      internationalization.activate(request.language)
      return {
        schema: new GraphQLSchema({
          query: createSchema(internationalization),
        }),
        graphiql: true,
      }
    }),
  )

server.listen(3000)
