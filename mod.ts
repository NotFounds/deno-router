import {
  Status,
  STATUS_TEXT,
} from './deps.ts';

const HTTPMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'] as const;
type HTTPMethod = typeof HTTPMethods[number];
type WrappedHandler = (req: Request, urlRes: URLPatternResult | null) => Response | Promise<Response>;
type RouteMap = Map<URLPattern, WrappedHandler>;
type SubpathRoute = {
  pattern: URLPattern;
  router: Router;
};

export class Router {
  #subpathHandlers: Array<SubpathRoute>;
  #handlers: Record<HTTPMethod, RouteMap | null>;
  constructor() {
    this.#subpathHandlers = [];
    this.#handlers = Object.fromEntries(HTTPMethods.map(method => [method, null])) as Record<HTTPMethod, RouteMap | null>;
  }

  get(pathname: string, handler: WrappedHandler) { return this.pushHandler("GET", pathname, handler); }
  post(pathname: string, handler: WrappedHandler) { return this.pushHandler("POST", pathname, handler); }
  put(pathname: string, handler: WrappedHandler) { return this.pushHandler("PUT", pathname, handler); }
  patch(pathname: string, handler: WrappedHandler) { return this.pushHandler("PATCH", pathname, handler); }
  delete(pathname: string, handler: WrappedHandler) { return this.pushHandler("DELETE", pathname, handler); }
  head(pathname: string, handler: WrappedHandler) { return this.pushHandler("HEAD", pathname, handler); }

  subpath(pathname: string, router: Router) {
    this.#subpathHandlers.push({ pattern: new URLPattern({ pathname }), router });
    return this;
  }

  private pushHandler(method: HTTPMethod, pathname: string, handler: WrappedHandler) {
    if (!this.#handlers[method]) {
      this.#handlers[method] = new Map();
    }
    this.#handlers[method]!.set(new URLPattern({ pathname }), handler);
    return this;
  }

  route(req: Request): Response | Promise<Response> {
    try {
      for (const { pattern, router } of this.#subpathHandlers) {
        const matched = pattern.exec(req.url);
        if (matched) {
          return router.route(req);
        }
      }
      const method = req.method as HTTPMethod;
      if (this.#handlers[method] !== null) {
        for (const [pattern, handler] of this.#handlers[method]!) {
          const matched = pattern.exec(req.url);
          if (matched) {
            return handler(req, matched);
          }
        }
      }
      return new Response(STATUS_TEXT.get(Status.NotFound), { status: Status.NotFound });
    } catch(e) {
      console.error(e);
      return new Response(STATUS_TEXT.get(Status.InternalServerError), { status: Status.InternalServerError });
    }
  }

  printRoutes(columnName: boolean = true) {
    if (columnName) {
      console.log('Method    Path                                                        Handler');
    }
    this.print();
  }
  protected print(prefixPattern = '') {
    const trimmedPrefixPattern = prefixPattern.trim().replace(/\*/, '');
    for (const { pattern, router } of this.#subpathHandlers) {
      const formattedPath = [trimmedPrefixPattern, pattern.pathname].filter(p => p !== "").join('/');
      router.print(formattedPath);
    }
    for (const [method, routeMap] of Object.entries(this.#handlers)) {
      if (routeMap !== null) {
        for (const [pattern, handler] of routeMap) {
          const path = [trimmedPrefixPattern, pattern.pathname].filter(p => p !== "").join('/');
          const handlerName = handler.name;
          console.log(`${method}${spacer(10 - method.length)}${path}${spacer(60 - path.length)}${handlerName}`);
        }
      }
    }
  }
}

function spacer(n: number) {
  return ' '.repeat(n);
}
