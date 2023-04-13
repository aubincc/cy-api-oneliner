/// <reference types="../../dist" />
import { GET } from "../../dist";

describe("The jsonplaceholder test", {
  env: {
    ONELINER_DEFAULT_PATH_FOR_ALIAS: "body",
    ONELINER_API_STATUS_CODE_NAMES: {
      OK: { status: 200 },
      NOTFOUND: { status: 404, body: {} },
    },
  },
  baseUrl: "https://jsonplaceholder.typicode.com"
}, () => {
  beforeEach(() => { cy.localStorageRestore() });
  afterEach(() => { cy.localStorageBackup() });

  GET("/users").status("OK").alias("userlist").send();
  GET("/users/:id").params({ id: "@userlist.[0].id" }).status("OK").check({ "body.name": "Leanne Graham" }).send();
  GET("/toto").status("NOTFOUND").send();
});
