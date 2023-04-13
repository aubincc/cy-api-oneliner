/// <reference types="../../dist" />
import { GET, POST } from "../../dist";

describe(
  "Magic!",
  {
    env: {
      userpwd: { login: "admin@cypress", password: "I4mGr00t!" },
      API_MESSAGES: false, // @bahmutov/cy-api
      API_SHOW_CREDENTIALS: false, // @bahmutov/cy-api
      ONELINER_DEFAULT_PATH_FOR_ALIAS: "body.data",
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
    before(() => {
      cy.localStorageRestore("fromFixture");
    });


    beforeEach(() => {
      cy.localStorageRestore();
    });

    afterEach(() => {
      cy.localStorageBackup();
    });

    after(() => {
      cy.localStorageBackup("toFixture");
    });

    before(() => {
      POST("/auth/login").bodyparams({ user: Cypress.env("userpwd").login, pwd: Cypress.env("userpwd").password }).alias("m-e").status("OK").send("inHook")
    });

    it("trigger a request in the before hook", () => {
      cy.log("a request was triggered in the before hook");
    });

    GET("/user/:id").session("@m-e.jwt").params({ id: 2 }).status("OK").alias("user1").check({ "body.data.name": "Bahmutov", "body.data.id": 2 }).send();

    it("use data stored within an alias and stores some more in another alias", () => {
      GET("/user").urlparams({ name: "@user1.name" }).session("@m-e.jwt").alias("user2", "body.data.list[1]").send("inHook");
    });

    it("use nested data stored within an alias, along with a session", () => {
      GET("/user/:id").params({ id: "@user2.id" }).session("@m-e.jwt").send("inHook");
    });

    GET("/group/:id").params({ id: "@m-e.groups[1].id" }).session("@m-e.jwt").status("RESTRICTED").check({ "body.code": "RESTRICTED" }).send();

    GET("/foo").status("UNAUTHORIZED").check({ "body.code": "UNAUTHORIZED" }).send();

    GET("/bar").status("NOTFOUND").check({ "body.code": "SLIM_NOT_FOUND" }).send();
  }
);
