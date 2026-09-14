# cy-api-oneliner

> Write API tests with minimal effort.

Idea :bulb:

Make user stories and integration tests on your backend in no time.

Idea :bulb:

Build up state before running [Cypress](https://cypress.io/) end-to-end tests on an app.

## Dev

![`cy-api-oneliner` in vscode](images/cy-api-oneliner_dev.png)

## Run

![`cy-api-oneliner` in the runner](images/cy-api-oneliner_run.png)

## Migrating to 2.0

2.0 reads its settings with `Cypress.expose()` instead of `Cypress.env()`, which is deprecated since Cypress 15.10.0 and removed in Cypress 16.

### Requirements

- Cypress >= 15.10.0 (tested with 15.21.1 and 16.0.0). With an older Cypress, reading a setting fails with `cy-api-oneliner requires Cypress >= 15.10.0`: stay on cy-api-oneliner 1.x.
- Per-suite and per-test `{ expose: {...} }` overrides need Cypress >= 15.17.0 (older 15.x versions silently ignore them).

### Move the settings from `env` to `expose`

Move **all** the settings: the `ONELINER_*` keys, `API_URL`, `ENVIRONMENT`, and also `API_MESSAGES` / `API_SHOW_CREDENTIALS`, which `@bahmutov/cy-api` 2.3.0 reads from `expose` only.

Before (1.x):

```javascript
// cypress.config.ts
import { defineConfig } from "cypress";

export default defineConfig({
  env: {
    API_URL: "https://api.example.com",
    ENVIRONMENT: "staging",
    API_MESSAGES: false,
    ONELINER_DEFAULT_PATH_FOR_ALIAS: "body.data",
    ONELINER_API_AUTH_TYPE: "Bearer Token",
  },
});
```

After (2.0):

```javascript
// cypress.config.ts
import { defineConfig } from "cypress";

export default defineConfig({
  expose: {
    API_URL: "https://api.example.com",
    ENVIRONMENT: "staging",
    API_MESSAGES: false,
    ONELINER_DEFAULT_PATH_FOR_ALIAS: "body.data",
    ONELINER_API_AUTH_TYPE: "Bearer Token",
  },
});
```

Put `expose` where your `env` is today. Cypress does not merge a testing-type `expose` with the root one: if your configuration has `e2e: { expose: {...} }` (or `component: { expose: {...} }`), that object replaces the root `expose`, so add the settings there.

### Suite and test overrides

Replace `{ env: {...} }` with `{ expose: {...} }` in `describe()` and `it()` (Cypress >= 15.17.0). On Cypress 16, a remaining `{ env: {...} }` override fails the test when it starts.

Convert the overrides in the same change as the configuration: on Cypress 15.x, an `{ env }` override of a key that is already set in `expose` is ignored without warning, because the `expose` value wins. With `allowCypressEnv: false`, a leftover `{ env }` override fails the test instead.

```javascript
// 1.x
describe("Users", { env: { ONELINER_DEFAULT_PATH_FOR_ALIAS: "body.data" } }, () => {
  GET("/user").alias("userlist").send();
});

// 2.0
describe("Users", { expose: { ONELINER_DEFAULT_PATH_FOR_ALIAS: "body.data" } }, () => {
  GET("/user").alias("userlist").send();
});
```

In your own specs, replace `Cypress.env("KEY")` / `Cypress.env("KEY", value)` with `Cypress.expose("KEY")` / `Cypress.expose("KEY", value)` for public values (a value set this way persists for the rest of the spec file).

### Command line and OS variables

```shell
# 1.x
npx cypress run --env ENVIRONMENT=staging,API_URL=https://api.example.com
CYPRESS_ENVIRONMENT=staging npx cypress run

# 2.0
npx cypress run --expose ENVIRONMENT=staging,API_URL=https://api.example.com
```

`--env KEY=value` and `CYPRESS_KEY=value` OS variables never reach `expose`. `CYPRESS_EXPOSE='{"ENVIRONMENT":"staging"}'` also works, but it replaces the whole `expose` object of your configuration.

### Transitional `env` fallback on Cypress 15.x

On Cypress 15.x with `allowCypressEnv: true` (the 15.x default), a setting missing from `expose` but still set in `env` (configuration, `cypress.env.json`, `--env`, `CYPRESS_*` OS variables, `{ env }` overrides) is still used. cy-api-oneliner then warns once per key per spec file (once per run with "Run all specs" in `cypress open`), in the browser console and, when the setting is read inside a test or hook, in the Command Log:

```text
cy-api-oneliner: "API_URL" was read from Cypress.env(), which is deprecated since Cypress 15.10.0 and removed in Cypress 16: move "API_URL" from "env" to "expose" in your Cypress configuration
```

- When a key is set in both, the `expose` value wins and nothing is logged.
- The fallback never runs on Cypress 16 nor with `allowCypressEnv: false`: `env` values are ignored and the defaults apply.
- `API_MESSAGES` and `API_SHOW_CREDENTIALS` have no fallback: `@bahmutov/cy-api` only reads them from `expose`.

Once migrated, set `allowCypressEnv: false` on Cypress 15.x: the fallback stops, and any `Cypress.env()` call or `{ env }` override left in your specs or plugins fails, which shows what remains to migrate. On Cypress 16, remove the `allowCypressEnv` option.

### Secrets

`expose` values are public: any code running in the browser can read them. cy-api-oneliner reads no secret. Keep credentials out of `expose`, leave them in `env` (for example from a `CYPRESS_API_PASSWORD` OS variable in CI) and read them with `cy.env([...])`.

The [Cypress migration guide](https://docs.cypress.io/app/references/migration-guide#migrating-away-from-cypress-env) says: "Use `cy.env()` when: The values are sensitive (API keys, passwords, tokens, credentials, secrets)", and the [`Cypress.expose()` documentation](https://docs.cypress.io/api/cypress-api/expose) says: "Do NOT store sensitive data (API keys, passwords, tokens, etc.) using `Cypress.expose()`."

```javascript
import { POST } from "cy-api-oneliner";

describe("Account", () => {
  before(() => {
    cy.env(["API_PASSWORD"]).then(({ API_PASSWORD }) => {
      POST("/auth/login").bodyparams({ user: "john", pwd: API_PASSWORD }).alias("account").send("inHook");
    });
  });
});
```

`cy.env()` keeps the value out of `expose`, not out of the test output: cy-api-oneliner writes the `.params()`, `.bodyparams()` and `.urlparams()` values in the request title shown in the Command Log (and in the test title with `.send()`), and `@bahmutov/cy-api` displays the whole request by default, headers and body included (it only masks the `auth` password and bearer token, unless `API_SHOW_CREDENTIALS` is `true`).

Two cases need more than a hook:

- `{ env: {...} }` overrides holding credentials cannot become `{ expose: {...} }`, and `cy.env()` does not read overrides: move each set of credentials to the `env` of your configuration (or `cypress.env.json`) under its own key.
- With `.send()`, the values passed to `.bodyparams()` are evaluated while the spec file is loaded, where `cy.env()` cannot run (and `Cypress.env()` throws on Cypress 16). Store the secret in an alias from a hook instead: aliases in `.params()`, `.bodyparams()` and `.urlparams()` are resolved when the request runs, and the request title shows the alias name, not its value.

```javascript
import { POST } from "cy-api-oneliner";

describe("Login", () => {
  before(() => {
    cy.env(["users"]).then(({ users }) => {
      cy.writeAlias("creds", users.admin);
    });
    cy.localStorageBackup(); // keeps the alias for the next tests, see "Across tests & across spec files"
  });

  beforeEach(() => {
    cy.localStorageRestore();
  });

  POST("/auth/login").bodyparams({ user: "@creds.user", pwd: "@creds.pwd" }).send();
});
```

The alias keeps the secret in `localStorage` and in the `cy.localStorageBackup()` memory: do not combine it with `cy.localStorageBackup("toFixture")`, which writes the backup to `cypress/fixtures/localstorage.backup.json`. The request title shows the alias name, but the console props of the Command Log entries and the `@bahmutov/cy-api` request display still show the resolved value.

### `@cypress/skip-test` is no longer a dependency

`cy.skipOn()` and `cy.onlyOn()` are still registered by `import "cy-api-oneliner"`, from a bundled copy (see [`cy.skipOn()` & `cy.onlyOn()`](#cyskipon--cyonlyon)). `@cypress/skip-test` is no longer installed with cy-api-oneliner, so if your project used it directly:

- replace `import { onlyOn } from "@cypress/skip-test"` with `import { onlyOn } from "cy-api-oneliner"` (same for `skipOn` and `isOn`);
- remove `import "@cypress/skip-test/support"` from your support file;
- remove `"@cypress/skip-test"` from `types` in your `tsconfig.json`;
- replace `CYPRESS_ENVIRONMENT=staging` with `--expose ENVIRONMENT=staging`.

### Electron is deprecated in Cypress 16

Electron still runs as a test browser in Cypress 16, with a deprecation warning. Prefer `--browser chrome`, `--browser edge` or `--browser firefox` (Firefox >= 140 since Cypress 15.19).

## How-to

### 1. Install

cy-api-oneliner 2.x requires Cypress >= 15.10.0. Upgrading from 1.x? See [Migrating to 2.0](#migrating-to-20).

```shell
# if you are making a separate project for your tests
npm install cypress cy-api-oneliner --save
# if you are doing it inside your API project
npm install cypress cy-api-oneliner --save-dev
```

### 2. Run Cypress and close it

```shell
npx cypress open --e2e
```

Then close Cypress

### 3. Import the module

Paste the following line into the file `cypress/support/e2e.js`

```javascript
import "cy-api-oneliner";
```

#### 4. Create a fixture file

Create the file `cypress/fixtures/localstorage.backup.json`

Paste this line in that file :

```json
{}
```

#### 4. Create a spec file

Create a `.cy.(js|ts)` file in the `cypress/e2e` folder of your project.

Paste this line at the top of your spec file:

```javascript
import { GET, POST, DELETE } from "cy-api-oneliner";
```

Start playing!

## The HTTP method functions (_the first line of your spec file_)

`["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"]` are the available functions that you can use to make HTTP requests to your API.

```javascript
import { GET, POST } from "cy-api-oneliner";

describe("Just the two of them", () => {
  GET("/").send();
  POST("/new-file").send();
});
```

or you can import them all at once:

```javascript
import * as API from "cy-api-oneliner";

describe("All of them", () => {
  API.GET("/").send();
  API.POST("/new-file").send();
  API.DELETE("/files").send();
});
```

## The necessary`.send()` method

`.send()` cannot be forgotten.

It will generate an entire autonomous test, an `it()` with prebuilt title and it's very own `cy.api()` request. Therefore it cannot be place within another `it()` wrapper.

Should you need to make such a request within hooks like `before()`, `after()`, `beforeEach()`, `afterEach()` or with a tests where you plan on running other Cypress commands, you can make use of `"inHook"` as one and only parameter: `.send("inHook")`.

Then it will generate a prebuilt `cy.api()` request which you can place anywhere.

## The `.alias()` method

### Re-using data stored in an alias

Almost any string starting with an `@` will fetch data stored under the following alias name.

Example :

```javascript
POST("/auth/login").bodyparams({ user: "John Doe", pwd: "$tr0ng!Pwd" }).alias("account").send();

GET("/user").session("@account.jwt").alias("userlist").send();

GET("/user/:id").bodyparams({ id: "@userlist[0].id" }).session("@account.jwt").send();
```

### Across tests & across spec files

```javascript
describe("", () => {
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

  /**
   * Your tests!
   */
});
```

### Alias related settings

`.alias()` can take a second param to specify which part of the response should be stored.

By default, when no second param is set, it takes the response body.

If all route return real information in a child path, you can specify that path in this `expose` setting (see [Configuration](#configuration)):

`ONELINER_DEFAULT_PATH_FOR_ALIAS = "body"` (default value, for example set it to `"body.data"`)

Example :

```javascript
GET("/building").alias("building", "body.data.list[2]").send();

GET("/user").alias("my-user").send();

POST("/user/:id").params({ id: "@my-user.id" }).bodyparams({ building: "@building.id" }).send();

GET("/user").urlparams({ name: "@my-user.name", building: "@building.name" }).send();
```

## The .session() method

### Session related settings

By default, the requests will be sent without altering the headers or query string.

If you wish to make a request that authenticates a user, then make a second request to use the provided session token, you should set these `expose` settings accordingly (see [Configuration](#configuration)).

These are the default values:

- `ONELINER_API_AUTH_TYPE = "No Auth"`
- `ONELINER_API_AUTH_CREDENTIALS_LOCATION = "header"`

For an API requiring a Bearer Token, you would set them like so:

- `ONELINER_API_AUTH_TYPE = "Bearer Token"`
- `ONELINER_API_AUTH_CREDENTIALS_LOCATION = "header"`

For an API requiring an API Key passed in a querystring, you would set them like this:

- `ONELINER_API_AUTH_TYPE = "API Key"`
- `ONELINER_API_AUTH_CREDENTIALS_LOCATION = "query"` (any value other than `"header"`)

### Available session types

Default session type

- `"No Auth"`

List of supported session types

- `"API Key"`
- `"Bearer Token"`
- `"Basic Auth"`

List of unsupported session types (yet?)

- `"JWT Bearer"`
- `"Digest Auth"`
- `"OAuth 1.0"`
- `"OAuth 2.0"`
- `"Hawk Authentication"`
- `"AWS Signature"`
- `"NTLM Authentication"`
- `"Akamai EdgeGrid"`

### Formatting the auth credentials passed to .session()

Coming soon...

## The .params() method

If you have a route containing parameters, like `GET /user/:id` or `POST /week/:week_id/day/:day_id/timerange`, you may need to iterate over them in order to test several values from an array, or several arrays.

`.params()` will allow you to replace the string immediately after `:` by any thing you like, using a value that you generate...

```javascript
const goodones = [1, 2, 3]
const badones = [0, "a", "null"]

it("test the good ones"), () => {
  goodones.forEach((g) => {
    GET("/user/:id").params({id: ${g}}).send("inHook");
  });
});

it("test the bad ones"), () => {
  badones.forEach((b) => {
    GET("/user/:id").params({id: ${b}}).send("inHook");
  });
});
```

...or fetching one from an earlier stored alias.

```javascript
GET("/week").alias("weeklist").send();

GET("/day").alias("daylist").send();

POST("/week/:week_id/day/:day_id/timerange").params({ week_id: "@weeklist[52].id", day_id: "@daylist[1].id" }).send("inHook");
```

## The .bodyparams() and .urlparams() methods

`.bodyparams()` sends the body as-is, except for aliases.

`.urlparams()` sends the params in the form of a query string with minimal alteration, except for aliases.

## The .status() method

`.status()` adds quick assertions on recognisable patterns in similar response depending on their status codes.

On your API, there may be more than just the HTTP status codes that allow the frontend to respond and operate correctly.

It can only be used if you configure the setting `ONELINER_API_STATUS_CODE_NAMES` in `expose` (see [Configuration](#configuration)). Without it, `.status()` fails the test with an explicit error.

Here is an example

```javascript
// in cypress.config.ts / cypress.config.js
{
  expose: {
    ONELINER_API_STATUS_CODE_NAMES: {
      OK: { status: 200, "body.error": 0, "body.state": "ok" },
      RESTRICTED: { status: 200, "body.error": 1, "body.state": "error" },
      UNAUTHORIZED: { status: 401, "body.error": 1, "body.state": "error" },
      NOTFOUND: { status: 404, "body.error": 1, "body.state": "error" },
    },
  },
}

// in your spec file
GET("/user/1").status("OK").send()
GET("/user/2").status("RESTRICTED").send()
GET("/admin").status("UNAUTHORIZED").send()
GET("/").status("NOTFOUND").send()
```

## The .check() method

`.check` helps generate assertions, also allowing you to cross-check values with previously stored aliases.

```javascript
POST("/auth/login").bodyparams({ user: "god", pwd: "V3ry$tr0ngP4s$w0rd!" }).alias("me").status("OK").send();
GET("/user/:id").session("@me.jwt").params({ id: 2 }).status("OK").check({ "body.data.name": "Bahmutov", "body.data.id": 2 }).send();
```

## The .skip() method

`.skip` allows to skip a test and show a comment.

It CANNOT be used without a comment! The comment MUST be a non-empty string.

When used within with the `.send("inHook")` inside a `beforeEach()` hook for example, it will skip the associated test but will not disable preceeding requests.

```javascript
GET("/skipped/test").skip("issue #666 :: The devil is in the details").send();
```

## The .description() method

`.description` adds a description to the title of the test.

This can be usefull for end-to-end tests.

```javascript
GET("/add/description").description("This test has a description").send();
```

## Cypress Custom Commands

### `cy.localStorageBackup()` & `cy.localStorageRestore()`

see the `.alias()` section [here](#across-tests--across-spec-files)

### `cy.writeAlias()`

Store a value into an alias, using writeAlias as a chained command or using a second param.

Example:

```javascript
it("Verify the cy.writeAlias() command chained with subject", () => {
  cy.wrap("is working").writeAlias("chained1");
  cy.wrapAlias("@chained1").should("eq", "is working");

  cy.wrap({ text: "is working" }).writeAlias("chained2");
  cy.wrapAlias("@chained2.text").should("eq", "is working");
});

it("Verify the cy.writeAlias() command with given data", () => {
  cy.writeAlias("subject1", "is working");
  cy.wrapAlias("@subject1").should("eq", "is working");

  cy.writeAlias("subject2", { text: "is working" });
  cy.wrapAlias("@subject2.text").should("eq", "is working");
});
```

### `cy.wrapAlias()`

Return a the value of an alias, with or without its nested key

Example:

```javascript
it("Iterate over a list", () => {
  GET("/week").alias("weeklist").send("inHook");
  cy.wrapAlias("@weeklist").each((week) => {
    cy.wrap(week).should((w) => {
      expect(w.number).toBeGreaterThanOrEqual(1);
      expect(w.number).toBeLessThanOrEqual(52);
    });
  });
});
```

### `cy.dropAlias()`

Clear the localStorage of the given alias

Example:

```javascript
it("Remove the now useless alias", () => {
  GET("/banana").alias("bananalist").send("inHook");
  // more tests with the "@bananalist" alias
  cy.dropAlias("@bananalist");
});
```

### `cy.setSession()`

Save an alias that will be used by default if .session() is not used in a request

Useful TIP:

When a default session is set, using the .session() method with these values send a request without any authentication:

`.session()`, `.session(0)`, `.session("")`, `.session(null)`, `.session(undefined)`

Example:

```javascript
before(() => {
  POST("/auth/login").bodyparams({ user: "login1", pwd: "password1" }).alias("account1").send("inHook");
  POST("/auth/login").bodyparams({ user: "login1", pwd: "password1" }).alias("account2").send("inHook");
  cy.setSession("@account1.jwt");
});

GET("/user/1").send(); // uses "@account1.jwt"
GET("/user/2").session("").send(); // single shot `ONELINER_API_AUTH_TYPE = "No Auth"`
GET("/user/3").session("@account2.jwt").send(); // uses "@account2.jwt"
GET("/user/4").send(); // uses "@account1.jwt"
```

### `cy.dropSession()`

Forget the setSession

Example:

```javascript
before(() => {
  POST("/auth/login").bodyparams({ user: "login1", pwd: "password1" }).alias("account1").send("inHook");
  cy.setSession("@account1.jwt");
});

GET("/user/1").send(); // uses "@account1.jwt"
it("Drop default session", () => {
  cy.dropSession();
});
GET("/user/2").session("@account1.jwt").send(); // uses "@account1.jwt
GET("/user/3").send();
```

### `cy.skipOn()` & `cy.onlyOn()`

These commands come from a bundled copy of [`@cypress/skip-test`](https://github.com/cypress-io/cypress-skip-test) 2.6.1 (archived and deprecated on npm): `import "cy-api-oneliner"` registers them, nothing else to install.

`cy.skipOn(condition)` skips the current test when the condition matches, `cy.onlyOn(condition)` skips it when the condition does not match. Skipped tests are reported as pending.

```javascript
it("runs everywhere but on Windows", () => {
  cy.skipOn("windows");
  GET("/files").send("inHook");
});

it("runs only on the staging environment", () => {
  cy.onlyOn("staging"); // npx cypress run --expose ENVIRONMENT=staging
  GET("/user").send("inHook");
});
```

The condition can be:

- a boolean: `cy.skipOn(true)`, `cy.onlyOn(Cypress.platform === "linux")`;
- a platform: `"darwin"` (or `"mac"`), `"win32"` (or `"windows"`, `"win"`), `"linux"`;
- a browser: `"electron"`, `"chrome"`, `"firefox"` (other browsers, such as `"edge"`, are not recognized as browser names);
- `"headed"` or `"headless"` (not supported by `cy.skipOn()` without a callback);
- the value of the `ENVIRONMENT` setting, read from `expose` (see [Configuration](#configuration));
- any other string, matched as a substring of `baseUrl` (for example `"localhost"`).

The named exports `skipOn()`, `onlyOn()` and `isOn()` work outside of tests: `skipOn()` and `onlyOn()` register the tests of their callback only when the condition allows it, `isOn()` returns a boolean.

```javascript
import { GET, isOn, onlyOn, skipOn } from "cy-api-oneliner";

onlyOn("localhost", () => {
  describe("Local server only", () => {
    GET("/").send();
  });
});

skipOn("firefox", () => {
  GET("/user").send();
});

it("adapts to the environment", () => {
  GET("/user/:id")
    .params({ id: isOn("staging") ? 2 : 1 })
    .send("inHook");
});
```

Called at spec or `describe()` level, as above, `skipOn()` and `onlyOn()` run while the spec file is loaded, before any test starts: there, `ENVIRONMENT` comes from your configuration or `--expose`, not from `describe()` / `it()` overrides, and when a callback is not run, a pending `Skipping test(s) ...` test can be registered in its place. Called inside a test, they see the `expose` overrides of that test.

## Configuration

cy-api-oneliner reads its settings with `Cypress.expose()` when a request runs (inside the test or hook), so they can change from one suite or test to another.

On Cypress 15.x, settings still set in `env` keep working for now, with a warning: see [Migrating to 2.0](#migrating-to-20).

### Where to set the settings

- In the `expose` object of your Cypress configuration (`cypress.config.ts` / `cypress.config.js`). An `e2e.expose` (or `component.expose`) object replaces the root `expose` instead of being merged with it: keep all the settings in one of them.
- On the command line: `npx cypress run --expose ENVIRONMENT=staging,API_URL=https://api.example.com`. `--env KEY=value` and `CYPRESS_KEY=value` OS variables do not reach `expose`.
- Per suite or per test, with `{ expose: {...} }` overrides (Cypress >= 15.17.0, older 15.x versions silently ignore them).

```javascript
// cypress.config.ts
import { defineConfig } from "cypress";

export default defineConfig({
  expose: {
    API_URL: "https://api.example.com",
    ENVIRONMENT: "staging",
    ONELINER_DEFAULT_PATH_FOR_ALIAS: "body.data",
    ONELINER_DEFAULT_REQUEST_PARAMS: { failOnStatusCode: false },
    ONELINER_API_AUTH_TYPE: "Bearer Token",
    ONELINER_API_AUTH_CREDENTIALS_LOCATION: "header",
    ONELINER_API_STATUS_CODE_NAMES: {
      OK: { status: 200, "body.error": 0, "body.state": "ok" },
      UNAUTHORIZED: { status: 401, "body.error": 1, "body.state": "error" },
    },
    API_MESSAGES: false,
    API_SHOW_CREDENTIALS: false,
  },
  e2e: {
    baseUrl: "http://localhost:3003",
  },
});
```

```javascript
// in your spec file: .send() creates its own test, so only suite overrides reach it; test overrides apply to .send("inHook") inside that test
describe("Public routes", { expose: { ONELINER_API_AUTH_TYPE: "No Auth" } }, () => {
  GET("/").send();

  it("stores the whole body", { expose: { ONELINER_DEFAULT_PATH_FOR_ALIAS: "body" } }, () => {
    GET("/user").alias("userlist").send("inHook");
  });
});
```

### Settings

| Setting                                  | Default when unset                 | Used by                                                                                                                         |
| ---------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `API_URL`                                | none (relative URLs use `baseUrl`) | every `cy.request()`, see [`API_URL`](#api_url) below                                                                           |
| `ONELINER_DEFAULT_PATH_FOR_ALIAS`        | `"body"`                           | `.alias()` without a second argument, see [`.alias()`](#alias-related-settings)                                                 |
| `ONELINER_DEFAULT_REQUEST_PARAMS`        | none                               | merged into the options of every cy-api-oneliner request, for example `{ failOnStatusCode: false, form: true }`                 |
| `ONELINER_API_AUTH_TYPE`                 | `"No Auth"`                        | `.session()` and `cy.setSession()`, see [`.session()`](#session-related-settings)                                               |
| `ONELINER_API_AUTH_CREDENTIALS_LOCATION` | `"header"`                         | `.session()` and `cy.setSession()`, see [`.session()`](#session-related-settings)                                               |
| `ONELINER_API_STATUS_CODE_NAMES`         | none (required by `.status()`)     | `.status()`, see [`.status()`](#the-status-method)                                                                              |
| `ENVIRONMENT`                            | none                               | `cy.skipOn()`, `cy.onlyOn()`, `skipOn()`, `onlyOn()`, `isOn()`, see [`cy.skipOn()` & `cy.onlyOn()`](#cyskipon--cyonlyon)        |
| `API_MESSAGES`                           | `true`                             | `@bahmutov/cy-api`: `false` stops the requests to the server messages endpoint (`expose` only, no `env` fallback)               |
| `API_SHOW_CREDENTIALS`                   | `false`                            | `@bahmutov/cy-api`: `true` shows the `auth` password and bearer token in the request display (`expose` only, no `env` fallback) |

### `API_URL`

cy-api-oneliner overwrites `cy.request()` globally: `API_URL` applies to every `cy.request()`, including the requests sent by `cy.api()` and by your own specs or other plugins, not only to cy-api-oneliner requests. It is read on every request.

- When `API_URL` is set, a URL that does not start with `http` is prefixed with it: with `API_URL: "https://api.example.com"`, `GET("/user")` requests `https://api.example.com/user`. No separator is added.
- URLs starting with `http` are sent unchanged.
- When `API_URL` is not set, relative URLs are resolved against `baseUrl` as usual.

## Coming some day <small>(_my todo list_)</small>

- Finish documenting the [.session()](#formatting-the-parameter-passed-to-session) section.

## Work

This work is very much based on an awesome tool that I rely on every day:

`@bahmutov/cy-api` [npmjs](https://www.npmjs.com/package/@bahmutov/cy-api) / [github](https://github.com/bahmutov/cy-api)

`cy.skipOn()` / `cy.onlyOn()` come from `@cypress/skip-test` [npmjs](https://www.npmjs.com/package/@cypress/skip-test) / [github](https://github.com/cypress-io/cypress-skip-test) (MIT, Copyright (c) 2019 Cypress.io, Inc.), shipped in `dist/skip-test.js` with its license notice.

## Small print

Author: Nicolas Aubin &lt;dev@aubin.cc&gt; &copy; 2023

- [@aubin_cc](https://twitter.com/aubin_cc)
- [aubin.cc](https://aubin.cc)
- [github.com/aubincc](https://github.com/aubincc)

License: MIT - do anything with the code, but don't blame me if it does not work.

Support: if you find any problems with this project, email / tweet /
[open issue](https://github.com/aubincc/cy-api-oneliner/issues) on Github

## MIT License

Copyright (c) 2023 Nicolas AUBIN

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the groups to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copygroup notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
