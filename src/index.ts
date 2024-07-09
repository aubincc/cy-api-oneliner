import "@bahmutov/cy-api";
import "@cypress/skip-test/support";
import { GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH, replaceAliasWithValue } from "./support.js";

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

      /**
       * Store a value of any type under an alias
       * @param alias must be a string and NOT start with "@"
       * @example
      ```
       it("Iterate over userlist", () => {
         cy.wrap({ name: "John" }).writeAlias("user")
         cy.wrapAlias("@user").then((username) => {
           cy.log(user.name) // "John"
         })
       });
      ```
       */
      writeAlias(alias: Alias): Chainable<string> | Cypress.Chainable<string[]>;
      /**
       * Store a value of any type under an alias
       * @param alias must be a string and NOT start with "@"
       * @example
      ```
       it("Iterate over userlist", () => {
         cy.writeAlias("user", { name: "John" })
         cy.wrapAlias("@user").then((username) => {
           cy.log(user.name) // "John"
         })
       });
      ```
       */
      writeAlias(alias: Alias, data: any): Chainable<string> | Cypress.Chainable<string[]>;
      /**
       * Return the value of an alias (with or with path to nested key)
       * @param alias must be a string and start with "@"
       * @example
       ```
    it("Iterate over userlist", () => {
      GET("/users").alias("userlist").send();
      cy.wrapAlias("@userlist").each((user) => {
        GET("/user/:id").params({ id: user.id }).send("inHook");
      })
    });
    ```
       */
      wrapAlias(alias: Alias): Chainable<string> | Cypress.Chainable<string[]>;
      /**
       * Remove the localStorage key (alias)
       * @param alias must be a string and start with "@"
       * @example
       ```
    cy.dropAlias("@userlist");
    ```
       */
      dropAlias(alias: Alias): Chainable<string> | Cypress.Chainable<string[]>;
      /**
       * Save a specific session alias to be used by default with all following requests that do not use the .session() method (alias)
       * @param alias must be a string and start with "@"
       * @example
      ```
    cy.setSession("@MyUser.token");
    ```
      */
      setSession(alias: Alias): Chainable<string> | Cypress.Chainable<string[]>;
      /**
       * Forget any session alias saved to use by default
       * @example
      ```
    cy.dropSession();
    ```
      */
      dropSession(): Chainable<string> | Cypress.Chainable<string[]>;
    }
  }
}

interface Alias extends String {
  startsWith: (prefix: string) => boolean;
  substring: (start: number) => string;
  length: number;
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

Cypress.Commands.add("writeAlias", { prevSubject: ['optional'] }, (subject, alias: Alias, data: any) => {
  if (typeof alias !== "string") throw new Error("Alias should be a string");
  if (alias.startsWith("@")) alias = alias.substring(1)

  if (!!subject) if (typeof subject === "object") subject = JSON.stringify(subject)
  if (!!data) if (typeof data === "object") data = JSON.stringify(data)

  if (!!subject && !!data) throw new Error(`Confusing: should we store "${subject}" or "${data}"?`);
  if (!subject && !data) throw new Error("There is no data to store");

  cy.window({ log: false }).its("localStorage", { log: false }).invoke("setItem", alias, subject || data);
});

Cypress.Commands.add("wrapAlias", (alias: Alias) => {
  cy.wrap(replaceAliasWithValue(alias), { log: false });
});

Cypress.Commands.add("dropAlias", (alias: Alias) => {
  const lsKey: string = alias.substring(1)
  cy.wrap(window.localStorage.getItem(lsKey), { log: false }).then((aliasNameExists) => {
    if (aliasNameExists) {
      cy.window({ log: false }).its("localStorage", { log: false }).invoke("removeItem", lsKey);
    }
  });
});

Cypress.Commands.add("setSession", (alias: Alias) => {
  if (alias) {
    const foundAlias = replaceAliasWithValue(alias)
    if (foundAlias === alias) {
      expect(alias, "setSession works better with an alias that can be found").to.equal("_alias_not_found_")
    } else {
      cy.window({ log: false }).its("localStorage", { log: false }).invoke("setItem", "setSession", alias);
    }
  } else {
    expect(alias, "setSession works better with an alias").to.equal("_alias_not_provided_")
  }
});

Cypress.Commands.add("dropSession", () => {
  cy.wrap(window.localStorage.getItem("setSession"), { log: false }).then((sessionExists) => {
    if (sessionExists) {
      cy.window({ log: false }).its("localStorage", { log: false }).invoke("removeItem", "setSession");
      delete LOCAL_STORAGE_MEMORY["setSession"]
    } else {
      cy.log("No set session to drop")
    }
  });
});

export { GET, POST, DELETE, PUT, PATCH, OPTIONS, HEAD };
