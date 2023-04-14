import "@bahmutov/cy-api";
import { GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH } from "./support.js";

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

export { GET, POST, DELETE, PUT, PATCH, OPTIONS, HEAD };
