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

  /**
   * POST() Start a POST request
   * @param {string} route the API endpoint to which the request is sent
   * @requires baseUrl in Cypress cypress/e2e/cypress.config.(ts|js)
   * @example POST("/auth/login").send()
   */
  export function POST(route: string): RequestBuilder;
  /**
   * GET() Start a GET request
   * @param {string} route the API endpoint to which the request is sent
   * @requires baseUrl in Cypress cypress/e2e/cypress.config.(ts|js)
   * @example GET("/user").send()
   */
  export function GET(route: string): RequestBuilder;
  /**
   * PUT() Start a PUT request
   * @param {string} route the API endpoint to which the request is sent
   * @requires baseUrl in Cypress cypress/e2e/cypress.config.(ts|js)
   * @example PUT("/user/:id").send()
   */
  export function PUT(route: string): RequestBuilder;
  /**
   * DELETE() Start a DELETE request
   * @param {string} route the API endpoint to which the request is sent
   * @requires baseUrl in Cypress cypress/e2e/cypress.config.(ts|js)
   * @example DELETE("/user/:id").send()
   */
  export function DELETE(route: string): RequestBuilder;
  /**
   * OPTIONS() Start a OPTIONS request
   * @param {string} route the API endpoint to which the request is sent
   * @requires baseUrl in Cypress cypress/e2e/cypress.config.(ts|js)
   * @example OPTIONS("/user").send()
   */
  export function OPTIONS(route: string): RequestBuilder;
  /**
   * HEAD() Start a HEAD request
   * @param {string} route the API endpoint to which the request is sent
   * @requires baseUrl in Cypress cypress/e2e/cypress.config.(ts|js)
   * @example HEAD("/").send()
   */
  export function HEAD(route: string): RequestBuilder;
  /**
   * PATCH() Start a PATCH request
   * @param {string} route the API endpoint to which the request is sent
   * @requires baseUrl in Cypress cypress/e2e/cypress.config.(ts|js)
   * @example PATCH("/user/:id").send()
   */
  export function PATCH(route: string): RequestBuilder;

  type RequestBuilder = {
    /**
     * Trigger the request
     * 
     * .send() is mandatory at the end of every test
     * @param {any} mode should be undefined or equal to "inHook", see the examples or the documentation for an explanation
     * @example GET("/user").send() // sends the command in a prebuilt "it()" test
     * @example GET("/user").send("inHook") // sends the command directly, to put it in an "it()" test or a "before()" hook
     */
    send: (mode?: "inHook") => any;
    /**
     * Save the response (or part of it) for later use
     * @param {string} name The name of the alias to save the response to
     * @param {Record<string, string>} pathToSavedValue The stringified path to the value in the response
     * @example GET("/group/:id").alias("FirstUser", "body.data.user[0]").send()
     * @example GET("/user/:id").alias("MyUser").send()
     * @requires Cypress.env("ONELINER_DEFAULT_PATH_FOR_ALIAS") to be configured (otherwise defaults to "body.data")
     */
    alias: (
      name: string,
      pathToSavedValue?: Record<string, string> | string | null
    ) => RequestBuilder;
    /**
     * Replace the identified endpoint param values
     * @param {Record<string, string | number>} params The value of the param to replace in the endpoint
     * @example GET("/user/:id").params({ id: 2 }).send() // Replaces `:id` by the value `2`
     */
    params: (params: Record<string, string | number>) => RequestBuilder;
    /**
     * Add url query string parameters like ?firstName=John&minAge=19
     * @param {Record<string, string | number>} params The url params (permissive: null, undefined... are not filtered out!)
     * @example GET("/user").urlparams({ firstName: "John", minAge: 19 }).send()
     */
    urlparams: (params: Record<string, string | number>) => RequestBuilder;
    /**
     * Add a specific body
     * @param {Record<string, string | number>} params The params sent as-is (aslmost) in the request body
     * @example POST("/auth/login").bodyparams({ user: "john@doe.com", password: "mYp4s$wd!" }).send()
     */
    bodyparams: (params: Record<string, string | number>) => RequestBuilder;
    /**
     * Make assertions on the response status code and other things
     * @param {StatusCodeName} statusCodeName The alias that you gave to an object containing grouped assertion patterns
     * @requires Cypress.env("ONELINER_API_STATUS_CODE_NAMES") to be configured
     * @example
        ##### Cypress Env variable
        ```
          ONELINER_API_STATUS_CODE_NAMES: {
            OK: { status: 200, "body.error": 0, "body.state": "ok" },
            KO: { status: 200, "body.error": 1, "body.state": "error" },
            UNAUTHORIZED: { status: 401, "body.error": 1, "body.state": "error" },
            NOTFOUND: { status: 404, "body.error": 1, "body.state": "error" },
          }
        ```
        ##### Usage
        ```
        GET("/auth/login").status("NOTFOUND").send()
        ```
     */
    status: (statusCodeName: StatusCodeName) => RequestBuilder;
    /**
     * Make assertions on the response body
     * @param {CheckObject} checkObject The object that contains key/values pairs that should match the response body
     * @example GET("/user").check({ body.data.name: "Doe", body.data.age: 32 }).send()
     */
    check: (checkObject: CheckObject) => RequestBuilder;
    /**
     * The session information to use in the header or wherever
     * @param {Credentials} credentials Object containing session information
     * @example GET("/user").session({ jwt: eyJ... }).send()
     * @example GET("/user").session("@my-alias.jwt").send()
     * @requires Cypress.env("ONELINER_API_AUTH_TYPE") to be configured (otherwise defaults to "No Auth")
     * @requires Cypress.env("ONELINER_API_AUTH_CREDENTIALS_LOCATION") to be configured (otherwise defaults to "header")
     * @example
        ##### Cypress Env variables
        ```
          ONELINER_API_AUTH_TYPE: "JWT Bearer",
          ONELINER_API_AUTH_CREDENTIALS_LOCATION: "header",
        ```
        ##### Usage
        ```
        POST("/auth/login").session("@john.jwt").send()
        ```
     */
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
