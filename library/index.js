const { ApolloServer } = require('apollo-server-express')
const { ApolloServerPluginDrainHttpServer } = require('apollo-server-core')
const { execute, subscribe } = require('graphql')
const { SubscriptionServer } = require('subscriptions-transport-ws')
const { makeExecutableSchema } = require('@graphql-tools/schema')

const express = require ('express')
const http = require('http')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

const User = require('./models/user')
const resolvers = require('./utils/resolvers')
const typeDefs = require('./utils/typedefs')
require('dotenv').config()

const JWT_SECRET = process.env.SECRET
const MONGODB_URI = process.env.MONGODB_URI

async function startApolloServer(typeDefs, resolvers) {
    const app = express();
    const httpServer = http.createServer(app);
    const schema = makeExecutableSchema({ typeDefs, resolvers })
  
    const subscriptionServer = SubscriptionServer.create({
      schema,
      execute,
      subscribe,
    }, {
      server: httpServer,
    })
  
    const server = new ApolloServer({
      schema,
      plugins: [{
        async serverWillStart() {
          return {
            async drainServer() {
              subscriptionServer.close()
            }
          }
        }
      }, ApolloServerPluginDrainHttpServer({ httpServer })],
      context: async ({ req }) => {
        const auth = req ? req.headers.authorization : null
        if (auth && auth.toLowerCase().startsWith('bearer ')) {
          const decodedToken = jwt.verify(
            auth.substring(7), JWT_SECRET
          )
          const currentUser = await User.findById(decodedToken.id)
          return { currentUser }
        }
      }
    })

    await server.start()
    server.applyMiddleware({
        app,
        path: '/',
    })

    await new Promise(resolve => httpServer.listen({ port: 4000 }, resolve))
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
    console.log(`🚀 Subscription endpoint ready at ws://localhost:4000/graphql`)
}

console.log('connecting to', MONGODB_URI)
  
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('connected to MongoDB')
        startApolloServer(typeDefs, resolvers)
    })
    .catch((error) => {
        console.log('error connection to MongoDB:', error.message)
    })
  
mongoose.set('debug', true);