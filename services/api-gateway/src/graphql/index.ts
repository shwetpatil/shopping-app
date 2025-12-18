import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { Application } from 'express';

export async function setupGraphQL(app: Application) {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== 'production', // Enable GraphQL playground in dev
  });

  await server.start();

  // Add GraphQL endpoint
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }: any) => {
        // Extract user from request (set by requireAuth middleware if present)
        return {
          user: req.user || null,
        };
      },
    })
  );

  console.log('🚀 GraphQL endpoint available at /graphql');
}
