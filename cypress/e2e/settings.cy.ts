/// <reference types="../../dist" />
import { GET, isOn, onlyOn } from "../../dist";

// the deprecated Cypress.env() can only be read on Cypress 15.x with allowCypressEnv enabled (its default on 15.x)
const legacyEnvReadable = parseInt(Cypress.version, 10) < 16 && (Cypress as any).config("allowCypressEnv") === true;

const warningsContaining = (spy: any, text: string) => spy.getCalls().filter((call: any) => String(call.args[0]).includes(text));

describe("Settings", () => {
  it("reads settings with Cypress.expose()", { expose: { ONELINER_DEFAULT_PATH_FOR_ALIAS: "body.data" } }, () => {
    cy.spy(console, "warn").as("warn");
    GET("/user/:id").params({ id: 2 }).alias("exposedUser").send("inHook");
    cy.wrapAlias("@exposedUser").should("deep.include", { id: 2, name: "Bahmutov" });
    cy.get("@warn").then((spy: any) => {
      expect(warningsContaining(spy, "cy-api-oneliner"), "cy-api-oneliner warnings").to.have.length(0);
    });
  });

  onlyOn(legacyEnvReadable, () => {
    describe("Deprecated Cypress.env() fallback (Cypress 15.x with allowCypressEnv)", () => {
      // read while this spec file is collected, when only the console warning can be emitted
      (Cypress as any).env("ENVIRONMENT", "legacy-environment");
      const environmentMatchedWhileCollecting = isOn("legacy-environment");

      afterEach(() => {
        (Cypress as any).env("ONELINER_DEFAULT_REQUEST_PARAMS", undefined);
        (Cypress as any).env("ONELINER_DEFAULT_PATH_FOR_ALIAS", undefined);
      });

      after(() => {
        (Cypress as any).env("ENVIRONMENT", undefined);
      });

      it("uses a setting only found in Cypress.env() and warns once per key", () => {
        (Cypress as any).env("ONELINER_DEFAULT_REQUEST_PARAMS", { failOnStatusCode: false });
        cy.spy(console, "warn").as("warn");
        // both requests fail unless failOnStatusCode: false is read from Cypress.env()
        GET("/missing-1").check({ status: 404 }).send("inHook");
        GET("/missing-2").check({ status: 404 }).send("inHook");
        cy.get("@warn").then((spy: any) => {
          expect(warningsContaining(spy, '"ONELINER_DEFAULT_REQUEST_PARAMS"'), "warnings about ONELINER_DEFAULT_REQUEST_PARAMS").to.have.length(1);
        });
      });

      it("prefers Cypress.expose() over Cypress.env()", { expose: { ONELINER_DEFAULT_PATH_FOR_ALIAS: "body.data" } }, () => {
        (Cypress as any).env("ONELINER_DEFAULT_PATH_FOR_ALIAS", "body.message");
        cy.spy(console, "warn").as("warn");
        GET("/user/:id").params({ id: 2 }).alias("precedenceUser").send("inHook");
        cy.wrapAlias("@precedenceUser").should("deep.include", { id: 2 });
        cy.get("@warn").then((spy: any) => {
          expect(warningsContaining(spy, '"ONELINER_DEFAULT_PATH_FOR_ALIAS"'), "warnings about ONELINER_DEFAULT_PATH_FOR_ALIAS").to.have.length(0);
        });
      });

      it("writes the Command Log warning in a test even when the key was first read while collecting specs", () => {
        expect(environmentMatchedWhileCollecting, "ENVIRONMENT read from Cypress.env() while collecting specs").to.equal(true);
        cy.then(() => {
          // a manual wrapper: cy.spy() cannot watch Cypress.log, which it calls itself
          const commandLogWarnings: any[] = [];
          const originalLog = Cypress.log;
          Cypress.log = ((options: any) => {
            if (options && options.name === "cy-api-oneliner") {
              commandLogWarnings.push(options);
            }
            return originalLog(options);
          }) as typeof Cypress.log;
          try {
            expect(isOn("legacy-environment"), 'isOn("legacy-environment")').to.equal(true);
            expect(isOn("legacy-environment"), 'isOn("legacy-environment") again').to.equal(true);
          } finally {
            Cypress.log = originalLog;
          }
          const environmentWarnings = commandLogWarnings.filter((options) => String(options.message).includes('"ENVIRONMENT"'));
          expect(environmentWarnings, "Command Log warnings about ENVIRONMENT").to.have.length(1);
        });
      });
    });

    // spies and stubs are only restored when the next test starts: keep this stub away from the afterEach above
    describe("Throwing Cypress.env() (like allowCypressEnv: false)", () => {
      it("ignores the error and uses the default value", () => {
        cy.stub(Cypress as any, "env")
          .as("env")
          .throws(new Error("Cypress.env() is not allowed"));
        GET("/user/:id").params({ id: 2 }).alias("defaultPathUser").send("inHook");
        // default ONELINER_DEFAULT_PATH_FOR_ALIAS: the whole body
        cy.wrapAlias("@defaultPathUser").should("have.nested.property", "data.id", 2);
        // proves that the error was thrown and ignored, not that Cypress.env() was skipped
        cy.get("@env").should("have.been.called");
      });
    });
  });

  onlyOn(!legacyEnvReadable, () => {
    describe("Without Cypress.env() (Cypress 16, or allowCypressEnv: false)", () => {
      it("never calls Cypress.env()", () => {
        cy.spy(Cypress as any, "env").as("env");
        GET("/user/:id").params({ id: 2 }).alias("noEnvUser").send("inHook");
        // default ONELINER_DEFAULT_PATH_FOR_ALIAS: the whole body
        cy.wrapAlias("@noEnvUser").should("have.nested.property", "data.id", 2);
        cy.get("@env").should("not.have.been.called");
      });
    });
  });
});
