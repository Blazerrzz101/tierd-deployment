// Simple Express server as a fallback for Next.js
const express = require('express');
const { createServer } = require('http');
const next = require('next');

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  // Health check endpoint
  server.get('/api/health', (req, res) => {
    console.log('Health check endpoint accessed');
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Default handler for all other routes through Next.js
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  // Create HTTP server
  const httpServer = createServer(server);
  
  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Server ready on port ${port}`);
  });
}).catch(err => {
  console.error('Error starting server:', err);
  process.exit(1);
}); 