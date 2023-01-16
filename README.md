# deno-router
A simple http router for deno.

## Example
```ts
import { serve } from "https://deno.land/std@0.119.0/http/server.ts";
import { Router } from '../mod.ts';

const port = 8080;
const noop = () => new Response();

const apiRouter = new Router()
  .get('/users/:id', noop)
  .post('/users', noop)
  .delete('/users/:id', noop);

const router = new Router()
  .subpath('/api', apiRouter)
  .get("/status", statusHandler)
  .get("/hello", helloHandler);

console.log("Routers:");
router.printRoutes();
console.log("");

console.log(`HTTP webserver running. Access it at http://localhost:${port}/`);
await serve((req) => router.route(req), { port });

// request handlers
function statusHandler(_req: Request, _urlRes: URLPatternResult | null): Response {
  return new Response(`OK`, { status: 200 });
}

function helloHandler(_req: Request, urlRes: URLPatternResult | null): Response {
  const name = urlRes?.search?.groups?.name;
  if (name) {
    return new Response(`Hello, ${name}!`);
  }
  return new Response(`Hello, World!`, { status: 200 });
}
```
