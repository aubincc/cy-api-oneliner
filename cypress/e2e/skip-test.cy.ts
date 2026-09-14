/// <reference types="../../dist" />
import { isOn, onlyOn, skipOn } from "../../dist";

// These 4 tests are skipped at run time on purpose, the run summary reports them as pending:
// - "cy.skipOn(true) skips the test"
// - "cy.onlyOn(false) skips the test"
// - "cy.skipOn(ENVIRONMENT) skips the test"
// - "cy.onlyOn(another environment) skips the test"
// A skipped test that runs anyway throws, and the last test fails if a test that must run was skipped.

const failIfNotSkipped = (command: string) =>
  cy.then(() => {
    throw new Error(`${command} should have skipped the test`);
  });

// recorded once the previous commands ran, so a skipped test records nothing
const ranTests: string[] = [];
const recordRun = (name: string) =>
  cy.then(() => {
    ranTests.push(name);
  });

describe("cy.skipOn() and cy.onlyOn() commands", () => {
  it("cy.skipOn(true) skips the test", () => {
    cy.skipOn(true);
    failIfNotSkipped("cy.skipOn(true)");
  });

  it("cy.onlyOn(false) skips the test", () => {
    cy.onlyOn(false);
    failIfNotSkipped("cy.onlyOn(false)");
  });

  it("cy.onlyOn(true) runs the test", () => {
    cy.onlyOn(true);
    recordRun("cy.onlyOn(true)");
  });

  it("cy.skipOn(false) runs the test", () => {
    cy.skipOn(false);
    recordRun("cy.skipOn(false)");
  });
});

describe("skipOn() and onlyOn() callbacks", () => {
  onlyOn(false, () => {
    it("onlyOn(false) must not register its tests", () => {
      throw new Error("onlyOn(false) should not have registered this test");
    });
  });

  skipOn(true, () => {
    it("skipOn(true) must not register its tests", () => {
      throw new Error("skipOn(true) should not have registered this test");
    });
  });

  onlyOn(true, () => {
    it("onlyOn(true) registers its tests", () => {
      recordRun("onlyOn(true, cb)");
    });
  });
});

describe("isOn()", () => {
  it("isOn() matches the current platform", () => {
    expect(isOn(Cypress.platform), `isOn("${Cypress.platform}")`).to.equal(true);
  });
});

describe("ENVIRONMENT setting", { expose: { ENVIRONMENT: "staging" } }, () => {
  it("isOn() matches the ENVIRONMENT setting", () => {
    expect(isOn("staging"), 'isOn("staging")').to.equal(true);
    expect(isOn("production"), 'isOn("production")').to.equal(false);
  });

  it("cy.skipOn(ENVIRONMENT) skips the test", () => {
    cy.skipOn("staging");
    failIfNotSkipped('cy.skipOn("staging")');
  });

  it("cy.onlyOn(another environment) skips the test", () => {
    cy.onlyOn("production");
    failIfNotSkipped('cy.onlyOn("production")');
  });

  it("cy.onlyOn(ENVIRONMENT) runs the test", () => {
    cy.onlyOn("staging");
    recordRun('cy.onlyOn("staging")');
  });
});

describe("Tests that must not be skipped", () => {
  it("ran every test that must not be skipped", () => {
    expect(ranTests).to.include.members(["cy.onlyOn(true)", "cy.skipOn(false)", "onlyOn(true, cb)", 'cy.onlyOn("staging")']);
  });
});
