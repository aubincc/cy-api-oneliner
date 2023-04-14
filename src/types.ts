declare module "cy-api-oneliner" {
  interface CyAPI {
    POST(route: string): RequestBuilder;
    GET(route: string): RequestBuilder;
    PUT(route: string): RequestBuilder;
    DELETE(route: string): RequestBuilder;
    OPTIONS(route: string): RequestBuilder;
    HEAD(route: string): RequestBuilder;
    PATCH(route: string): RequestBuilder;
  }

  export function POST(route: string): RequestBuilder;
  export function GET(route: string): RequestBuilder;
  export function PUT(route: string): RequestBuilder;
  export function DELETE(route: string): RequestBuilder;
  export function OPTIONS(route: string): RequestBuilder;
  export function HEAD(route: string): RequestBuilder;
  export function PATCH(route: string): RequestBuilder;

  type RequestBuilder = {
    send: (mode?: "inHook") => any;
    alias: (
      name: string,
      pathToSavedValue?: Record<string, string> | string | null
    ) => RequestBuilder;
    params: (params: Record<string, string | number>) => RequestBuilder;
    urlparams: (params: Record<string, string | number>) => RequestBuilder;
    bodyparams: (params: Record<string, string | number>) => RequestBuilder;
    status: (statusCodeName: StatusCodeName) => RequestBuilder;
    check: (checkObject: CheckObject) => RequestBuilder;
    session: (credentials: Credentials) => RequestBuilder;
  };

  type CheckObject = Record<string, any>;

  type StatusCodeName = string;

  type Credentials =
    | {
      token?: string;
      username?: string;
      password?: string;
      apiKey?: string;
      jwt?: string;
    }
    | string;
}
