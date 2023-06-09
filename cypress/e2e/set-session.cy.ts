/// <reference types="../../dist" />
import { GET, POST } from "../../dist";


context(
  "setSession",
  {
    env: {
      userpwd: { login: "admin@cypress", password: "I4mGr00t!" },
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
    describe("Alias is object of login request", () => {
      beforeEach(() => {
        cy.localStorageRestore();
      });

      afterEach(() => {
        cy.localStorageBackup();
      });

      before(() => {
        POST("/auth/login").bodyparams({ user: Cypress.env("userpwd").login, pwd: Cypress.env("userpwd").password }).alias("m-e").status("OK").send("inHook");
        cy.setSession("@m-e.jwt");
        GET("/user/:id").params({ id: 1 }).session("@m-e.jwt").description("@m-e.jwt uses @m-e.jwt").send("inHook"); // uses "@m-e.jwt"
        cy.localStorageBackup();
      });

      it("", () => {
        cy.log("Check the pre-requests from the before hook");
      })
      GET("/user/:id").params({ id: 1 }).description("no session method uses DEFAULT @m-e.jwt").send(); // uses "@m-e.jwt"
      GET("/user/:id").params({ id: 1 }).session("@m-e.jwt").description("@m-e.jwt uses @m-e.jwt").send(); // uses "@m-e.jwt"
      GET("/user/:id").params({ id: 0 }).session({}).description("EMPTY OBJECT uses DEFAULT @m-e.jwt").send(); // uses "@m-e.jwt"
      GET("/user/:id").params({ id: 2 }).session("").description("EMPTY STRING uses NOTHING").send(); // uses nothing
      GET("/user/:id").params({ id: 0 }).session(null).description("NULL uses NOTHING").send(); // uses "@m-e.jwt"
      GET("/user/:id").params({ id: 0 }).session(undefined).description("UNDEFINED uses NOTHING").send(); // uses "@m-e.jwt"
      GET("/user/:id").params({ id: 0 }).session(0).description("ZERO uses NOTHING").send(); // uses "@m-e.jwt"
      GET("/user/:id").params({ id: 0 }).session().description("EMPTY SESSION uses NOTHING").send(); // uses "@m-e.jwt"
      it("Drop default session", () => {
        cy.dropSession();
      });
      GET("/user/:id").params({ id: 2 }).description("no session method AFTER DROP uses NOTHING").send(); // uses nothing
      GET("/user/:id").params({ id: 1 }).session("@m-e.jwt").description("@m-e.jwt AFTER DROP uses @m-e.jwt").send(); // uses "@m-e.jwt"
    });

    describe("Alias directly stores the token", () => {
      beforeEach(() => {
        cy.localStorageRestore();
      });

      afterEach(() => {
        cy.localStorageBackup();
      });

      before(() => {
        POST("/auth/login").bodyparams({ user: Cypress.env("userpwd").login, pwd: Cypress.env("userpwd").password }).alias("m-e", "body.data.jwt").status("OK").send("inHook");
        cy.setSession("@m-e");
        GET("/user/:id").params({ id: 1 }).session("@m-e").description("@m-e uses @m-e").send("inHook"); // uses "@m-e"
        cy.localStorageBackup();
      });

      it("", () => {
        cy.log("Check the pre-requests from the before hook");
      })
      GET("/user/:id").params({ id: 1 }).description("no session method uses DEFAULT @m-e").send(); // uses "@m-e"
      GET("/user/:id").params({ id: 1 }).session("@m-e").description("@m-e uses @m-e").send(); // uses "@m-e"
      GET("/user/:id").params({ id: 0 }).session({}).description("EMPTY OBJECT uses DEFAULT @m-e").send(); // uses "@m-e"
      GET("/user/:id").params({ id: 2 }).session("").description("EMPTY STRING uses NOTHING").send(); // uses nothing
      GET("/user/:id").params({ id: 0 }).session(null).description("NULL uses NOTHING").send(); // uses "@m-ewt"
      GET("/user/:id").params({ id: 0 }).session(undefined).description("UNDEFINED uses NOTHING").send(); // uses "@m-e"
      GET("/user/:id").params({ id: 0 }).session(0).description("ZERO uses NOTHING").send(); // uses "@m-e"
      GET("/user/:id").params({ id: 0 }).session().description("EMPTY SESSION uses NOTHING").send(); // uses "@m-e"
      it("Drop default session", () => {
        cy.dropSession();
      });
      GET("/user/:id").params({ id: 2 }).description("no session method AFTER DROP uses NOTHING").send(); // uses nothing
      GET("/user/:id").params({ id: 1 }).session("@m-e").description("@m-e AFTER DROP uses @m-e").send(); // uses "@m-e"
    });
  }
);