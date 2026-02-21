import 'dotenv/config';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import http from 'http';
import cors from 'cors';

import connectDB from './config/db.js';
import { typeDefs } from './graphql/typeDefs.js';
import { resolvers } from './graphql/resolvers.js';
import authMiddleware from './middleware/auth.js';
import uploadRouter from './utils/upload.js';

// Connect to MongoDB
await connectDB();

const app = express();
const httpServer = http.createServer(app);

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  formatError: (formattedError) => {
    // Return clean error objects to client
    return {
      message: formattedError.message,
      code: formattedError.extensions?.code || 'INTERNAL_SERVER_ERROR',
    };
  },
});

await server.start();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Cloudinary image upload endpoint
app.use('/api/upload', uploadRouter);

// GraphQL endpoint
app.use(
  '/graphql',
  expressMiddleware(server, {
    context: authMiddleware,
  })
);

app.get('/', (req, res) => {
  res.json({
    message: 'COMP3133 Assignment 1 - Employee Management System API',
    graphql: '/graphql',
    upload: '/api/upload',
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`\n Server running at http://localhost:${PORT}`);
  console.log(`GraphQL Playground at http://localhost:${PORT}/graphql\n`);
});