/// <reference types="../../dist" />
import { GET } from "../../dist";

describe("API_URL in environment variables", {
  env: {
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
}, () => {
  //
  GET("/todos/1").check({ "body.status": 200 }).send();
  GET("/foo").status("UNAUTHORIZED").check({ "body.status": 404 }).send();
});

describe("API_URL in environment variables", () => {
  //
  GET("/home").send();
});
