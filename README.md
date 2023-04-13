# @aubincc/cy-api-oneliner

> Write API tests with minimal effort.

Idea :bulb:

Make user stories and integration tests on your backend in no time.

Idea :bulb:

Build up state before running [Cypress](https://cypress.io/) end-to-end tests on an app.

## Dev

![`cy-api-oneliner` in vscode](images/cy-api-oneliner_dev.png)

## Run

![`cy-api-oneliner` in the runner](images/cy-api-oneliner_run.png)

## How-to

### 1. Install

```shell
# if you are making a separate project for your tests
npm install cypress cy-api-oneliner --save
# if you are doing it inside your API project
npm install cypress cy-api-oneliner --save-dev
```

### 2. Run Cypress

```shell
npx cypress open --e2e --browser electron
```

Then close Cypress

### 3. Import the module

Paste the following line into the file `cypress/support/e2e.ts`

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

Create a `.cy.js` file or a `.cy.ts` file in the `cypress/e2e` folder of your project.

Paste these two lines at the top of your spec file:

```javascript
/// <reference types="cy-api-oneliner" />
import { GET, POST } from "cy-api-oneliner";
```

Start playing!

## The HTTP method functions (_the first two lines of your spec file_)

`["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"]` are the available functions that you can use to make HTTP requests to your API.

```javascript
/// <reference types="cy-api-oneliner" />
import { GET, POST } from "cy-api-oneliner";

describe("Just the two of them", () => {
  GET("/").send();
  POST("/new-file").send();
});
```

or you can import them all at once:

```javascript
/// <reference types="cy-api-oneliner" />
import * as api from "cy-api-oneliner";

describe("All of them", () => {
  api.GET("/").send();
  api.POST("/new-file").send();
  api.DELETE("/files").send();
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

### Alias related Cypress env vars

`.alias()` can take a second param to specify which part of the response should be stored.

By default, when no second param is set, it takes the response body.

If all route return real information in a child path, you can specify that in this Cypress environment variable :

`ONELINER_DEFAULT_PATH_FOR_ALIAS = "body.data"`

Example :

```javascript
GET("/building").alias("building", "body.data.list[2]").send();

GET("/user").alias("my-user").send();

POST("/user/:id").params({ id: "@my-user.id" }).bodyparams({ building: "@building.id" }).send();

GET("/user").urlparams({ name: "@my-user.name", building: "@building.name" }).send();
```

## The .session() method

### Session related Cypress env vars

By default, the requests will be sent without altering the headers or query string.

If you wish to make a request that authenticates a user, then make a second request to use the provided session token, you should set the Cypress environment variables accordingly.

These is the default value:

- `ONELINER_API_AUTH_TYPE = "No Auth"`

For an API requiring a Bearer Token, you would set them like so:

- `ONELINER_API_AUTH_TYPE = "Bearer Token"`
- `ONELINER_API_AUTH_CREDENTIALS_LOCATION: "header"`

For an API requiring an API Key passed in a querystring, you would set it like this:

- `ONELINER_API_AUTH_TYPE = "API Key"`

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

it("test the good ones"), () => {
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

It can only be used if you configure the Cypress env var `ONELINER_API_STATUS_CODE_NAMES`.

Here is an example

```javascript
// in cypress.config.ts / cypress.config.js
{
  env: {
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

## Cypress environment variables

- `ONELINER_DEFAULT_PATH_FOR_ALIAS = "body.data"` see the `.alias()` section [here](#alias-related-cypress-env-vars)
- `ONELINER_API_AUTH_TYPE = "No Auth"` see the `.session()` section [here](#session-related-cypress-env-vars)
- `ONELINER_API_AUTH_CREDENTIALS_LOCATION: "header"` see the `.session()` section [here](#session-related-cypress-env-vars)
- `ONELINER_API_STATUS_CODES = {}` see the `.status()` section [here](#the-status-method)

## Coming next <small>(_my todo list_)</small>

- A `SETSESSION()` function (possibly with a "inHook" param) for subsequent tests to use one same session alias (_this requires adapting the session() method_)
- A Cypress envronment variable to set `failOnStatusCode` to true or false depending on what the spec file is for. (_currently set to false always_)
- Finish documenting the [.session()](#formatting-the-parameter-passed-to-session) section.

## Work

This work is very much based on an awesome tool that I rely on every day:

`@bahmutov/cy-api` [npmjs](https://www.npmjs.com/package/@bahmutov/cy-api) / [github](https://github.com/bahmutov/cy-api)

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