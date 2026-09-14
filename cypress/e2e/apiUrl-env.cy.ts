/// <reference types="../../dist" />
import { GET } from "../../dist";

describe(
  "API_URL in expose settings",
  {
    expose: {
      API_URL: "https://jsonplaceholder.typicode.com",
      API_MESSAGES: false, // @bahmutov/cy-api
      API_SHOW_CREDENTIALS: false, // @bahmutov/cy-api
      ONELINER_DEFAULT_PATH_FOR_ALIAS: "body.data",
      ONELINER_DEFAULT_REQUEST_PARAMS: {
        failOnStatusCode: false,
      },
      ONELINER_API_AUTH_TYPE: "Bearer Token",
      ONELINER_API_AUTH_CREDENTIALS_LOCATION: "header",
      ONELINER_API_STATUS_CODE_NAMES: {
        OK: { status: 200, "body.error": 0, "body.state": "ok" },
        RESTRICTED: { status: 200, "body.error": 1, "body.state": "error" },
        UNAUTHORIZED: { status: 401, "body.error": 1, "body.state": "error" },
        NOTFOUND: { status: 404, "body.error": 1, "body.state": "error" },
      },
    },
  },
  () => {
    GET("/todos/1").check({ status: 200, "body.id": 1 }).send();
    // the local server answers 401 on /foo: a 404 proves that the request went to API_URL
    GET("/foo").check({ status: 404 }).send();
  }
);

describe("Without API_URL", () => {
  // API_URL does not leak from the previous suite's overrides
  GET("/").check({ "body.message": "API is running" }).send();
});
