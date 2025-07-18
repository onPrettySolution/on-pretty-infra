import {
  APIGatewayProxyCognitoAuthorizer,
  APIGatewayProxyEventV2WithRequestContext,
} from 'aws-lambda/trigger/api-gateway-proxy';
import express from 'express';
import { authorizerMiddleware } from './middlewares/authorizerMiddleware';
import { loggerMiddleware } from './middlewares/loggerMiddleware';
import tenantRoutes from './routes/tenantRoutes';
import invalidationRoutes from "./routes/invalidationRoutes";

interface IRequestContext {
  authorizer: {
    jwt: APIGatewayProxyCognitoAuthorizer;
  };
}

declare global {
  namespace Express {
    interface Request extends APIGatewayProxyEventV2WithRequestContext<IRequestContext> {
    }
  }
}

const app = express();

app.use(express.json());
app.use(loggerMiddleware);
app.use(authorizerMiddleware);

// routes
app.use('/api/tenants', tenantRoutes);
app.use('/api/invalidations', invalidationRoutes);
app.route('/api/tenants/debug').all((req, res) => {
  res.json({
    body: req.body,
    query: req.query,
    requestContext: req.requestContext,
  });
});

// Export the app for serverless-http
export default app;
