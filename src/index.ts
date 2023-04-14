import "@bahmutov/cy-api";
import * as support from "./support.js";

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Backup all data from localStorage
       ```
        // only accross current Cypress spec file
        afterEach(() => {
          cy.localStorageBackup();
        });

        // to be used in other Cypress spec files
        after(() => {
          cy.localStorageBackup("toFixture");
        });
       ```
       */
      localStorageBackup(origin?: any): Chainable<LocalStorage>
      /**
       * Restore previous backup to the localStorage
       * @example
       ```
        //only accross current Cypress spec file
        beforeEach(() => {
          cy.localStorageRestore();
        });

        // for use after another Cypress spec files
        before(() => {
          cy.localStorageRestore("fromFixture");
        });
       ```
       */
      localStorageRestore(origin?: any): Chainable<LocalStorage>
    }
  }
}

let LOCAL_STORAGE_MEMORY: { [key: string]: string } = {};

Cypress.Commands.add("localStorageBackup", (origin?: "toFixture") => {
  Object.keys(localStorage).forEach((key: string) => {
    LOCAL_STORAGE_MEMORY[key] = localStorage[key];
  });
  if (origin === "toFixture") {
    cy.writeFile("cypress/fixtures/localstorage.backup.json", LOCAL_STORAGE_MEMORY).wait(250);
  }
});

Cypress.Commands.add("localStorageRestore", (origin?: "fromFixture") => {
  if (origin === "fromFixture") {
    cy.fixture("localstorage.backup.json").then((fixturebackup) => {
      LOCAL_STORAGE_MEMORY = { ...LOCAL_STORAGE_MEMORY, ...fixturebackup }
      cy.localStorageRestore();
    });
  } else {
    Object.keys(LOCAL_STORAGE_MEMORY).forEach((key: string) => {
      localStorage.setItem(key, LOCAL_STORAGE_MEMORY[key]);
    });
  }
});

export default support;

/**
 * Make a POST request
 * @param route The API end point
 * @example POST("/auth/login").send()
 */
// @ts-expect-error
export function POST(route: string): RequestBuilder;

/**
 * Make a GET request
 * @param route The API end point
 * @example GET("/user").send()
 */
// @ts-expect-error
export function GET(route: string): RequestBuilder;

/**
 * Make a PUT request
 * @param route The API end point
 * @example PUT("/user/:id").send()
 */
// @ts-expect-error
export function PUT(route: string): RequestBuilder;

/**
 * Make a DELETE request
 * @param route The API end point
 * @example DELETE("/user/:id").send()
 */
// @ts-expect-error
export function DELETE(route: string): RequestBuilder;

/**
 * Make a OPTIONS request
 * @param route The API end point
 * @example OPTIONS("/user").send()
 */
// @ts-expect-error
export function OPTIONS(route: string): RequestBuilder;

/**
 * Make a HEAD request
 * @param route The API end point
 * @example HEAD("/").send()
 */
// @ts-expect-error
export function HEAD(route: string): RequestBuilder;

/**
 * Make a PATCH request
 * @param route The API end point
 * @example PATCH("/user/:id").send()
 */
// @ts-expect-error
export function PATCH(route: string): RequestBuilder;


/**
 * A builder for creating HTTP requests.
 */
type RequestBuilder = {
  /**
   * Trigger the request
   * @param mode The value of the param to replace in the endpoint
   * @example GET("/user").send() // sends the command in an "it()" test
   * @example GET("/user").send("inHook") // sends the command directly, to put it in an "it()" test or a "before()" hook
   */
  send: (mode?: "inHook") => any;
  /**
   * Save the response (or part of it) for later use
   * @param name The name of the alias to save the response to
   * @param pathToSavedValue The stringified path to the value in the response
   * @example GET("/group/:id").alias("FirstUser", "body.data.user[0]").send()
   * @example GET("/user/:id").alias("MyUser").send()
   * @requires Cypress.env("ONELINER_DEFAULT_PATH_FOR_ALIAS") to be configured (otherwise defaults to "body.data")
   */
  alias: (name: string, pathToSavedValue?: Record<string, string> | string | null) => RequestBuilder;
  /**
   * Replace the identified endpoint param values
   * @param params The value of the param to replace in the endpoint
   * @example GET("/user/:id").params({ id: 2 }).send()
   */
  params: (params: Record<string, string | number>) => RequestBuilder;
  /**
   * Add url parameters like ?firstName=John&minAge=19
   * @param params The url params (permissive: null, undefined... are not filtered out!)
   * @example GET("/user").urlparams({ firstName: "John", minAge: 19 }).send()
   */
  urlparams: (params: Record<string, string | number>) => RequestBuilder;
  /**
   * Add a specific body
   * @param params The params sent as-is (aslmost) in the request body
   * @example POST("/auth/login").bodyparams({ user: "john@doe.com", password: "mYp4s$wd!" }).send()
   */
  bodyparams: (params: Record<string, string | number>) => RequestBuilder;
  /**
   * Make assertions on the response status code and other things
   * @param statusCodeName The alias that you gave to an object containing grouped assertion patterns
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
   * @param checkObject The object that contains key/values pairs that should match the response body
   * @example GET("/user").check({ body.data.name: "Doe", body.data.age: 32 }).send()
   */
  check: (checkObject: CheckObject) => RequestBuilder;
  /**
   * The session information to use in the header or wherever
   * @param credentials Object containing session information
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

type Credentials = {
  token?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  jwt?: string;
} | string;
