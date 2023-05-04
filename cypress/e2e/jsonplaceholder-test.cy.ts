/// <reference types="../../dist" />
import { GET } from "../../dist";

describe(
  "The jsonplaceholder test",
  {
    env: {
      ONELINER_DEFAULT_PATH_FOR_ALIAS: "body",
      ONELINER_API_STATUS_CODE_NAMES: {
        OK: { status: 200 },
        NOTFOUND: { status: 404, body: {} },
      },
    },
    baseUrl: "https://jsonplaceholder.typicode.com",
  },
  () => {
    beforeEach(() => {
      cy.localStorageRestore();
    });
    afterEach(() => {
      cy.localStorageBackup();
    });

    GET("/users").status("OK").alias("userlist").send();
    GET("/users/:id").params({ id: "@userlist.[0].id" }).status("OK").check({ "body.name": "Leanne Graham" }).send();
    GET("/toto").status("NOTFOUND").send();

    ["a", 0, false, true, Infinity, {}, [], null, undefined].forEach((V) => {
      GET("/users/:id").params({ id: V }).send();
    });

    it("Should replace aliases wherever they are", () => {
      cy.window()
        .its("localStorage")
        .invoke("setItem", "value1", JSON.stringify({ id: "123", name: "groot" }));
      GET("/toto")
        .bodyparams({ name: "@value1.name", id: "@value1.id", test_with_object: { name: "@value1.name", id: "@value1.id" }, test_with_array: ["@value1.id"], test_with_objectarray: [{ name: "@value1.name", id: "@value1.id" }] })
        .send("inHook");
      cy.get("pre.hljs")
        .first()
        .then((request) => {
          const resultingBody = JSON.parse(request[0].textContent).body;
          const expectedBody = { name: "groot", id: "123", test_with_object: { name: "groot", id: "123" }, test_with_array: ["123"], test_with_objectarray: [{ name: "groot", id: "123" }] };
          expect(resultingBody).to.deep.equal(expectedBody);
        });
    });
  }
);
