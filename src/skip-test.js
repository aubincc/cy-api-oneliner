/**
 * cy.skipOn() and cy.onlyOn(): minimal copy of @cypress/skip-test 2.6.1 (https://github.com/cypress-io/cypress-skip-test),
 * which is archived and deprecated on npm.
 *
 * Changes from the original:
 * - the ENVIRONMENT name is read with Cypress.expose() (see ./settings.js) instead of Cypress.env(), removed in Cypress 16
 * - Cypress._ type checks are replaced by typeof (String and Boolean wrapper objects are now rejected as invalid syntax), Cypress.isBrowser() is always available
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2019 Cypress.io, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { readSetting } from "./settings.js";

/**
 * Cleans up the passed name which could be browser, platform or other.
 * @param {string} name The environment or platform or something else, like url
 * @returns {string} Normalized name
 * @example
 * normalizeName('mac') // 'darwin'
 * normalizeName('windows') // 'win32'
 * normalizeName('WIN') // 'win32'
 * normalizeName('localhost') // 'localhost'
 */
const normalizeName = (name) => {
  name = name.toLowerCase();

  // values are normalized strings we will use
  const aliases = {
    mac: "darwin",
    windows: "win32",
    win: "win32",
  };
  const normalizedName = aliases[name] ? aliases[name] : name;
  return normalizedName;
};

const getMochaContext = () => cy.state("runnable").ctx;
const skip = () => {
  const ctx = getMochaContext();
  return ctx.skip();
};

const isPlatform = (name) => ["win32", "darwin", "linux"].includes(name);
const isBrowser = (name) => ["electron", "chrome", "firefox"].includes(name);
const isHeadedName = (name) => ["headed", "headless"].includes(name);

/**
 * You can pass a custom environment name when running Cypress
 * @example
 * npx cypress run --expose ENVIRONMENT=staging
 * @returns {any} the ENVIRONMENT setting
 */
const getEnvironment = () => readSetting("ENVIRONMENT");

const isEnvironmentSet = () => {
  const environment = getEnvironment();
  return typeof environment === "string" && environment;
};

/**
 * @param {string} name Is checked against `ENVIRONMENT` value
 * @returns {boolean} true if the given argument matches environment string
 */
const isEnvironment = (name) => {
  const environment = getEnvironment();
  return environment && environment === name;
};

const headedMatches = (name) => {
  if (name === "headed") {
    return Cypress.browser.isHeaded;
  }
  if (name === "headless") {
    return Cypress.browser.isHeadless;
  }
  throw new Error(`Do not know how to treat headed flag "${name}"`);
};

const matchesUrlPart = (normalizedName) => {
  // assuming name is part of the url, and the baseUrl should be set
  const url = Cypress.config("baseUrl") || location.origin;
  return url && url.includes(normalizedName);
};

/**
 * Returns true if the test is running on the given browser or platform
 * or against given url.
 * @param {string} name Browser name, platform or url.
 * @returns {boolean} Returns true if the test runs against the given condition.
 */
export const isOn = (name) => {
  if (typeof name !== "string") {
    throw new Error("Invalid syntax: isOn expects a string argument");
  }

  const normalizedName = normalizeName(name);

  if (isPlatform(normalizedName)) {
    return Cypress.platform === normalizedName;
  }

  if (isBrowser(normalizedName)) {
    return Cypress.isBrowser(normalizedName);
  }

  if (isHeadedName(normalizedName)) {
    return headedMatches(normalizedName);
  }

  if (isEnvironment(name)) {
    return true;
  }

  return matchesUrlPart(normalizedName);
};

const skipOnBool = (flag, cb) => {
  if (typeof flag !== "boolean") {
    throw new Error("Invalid syntax: cy.skipOn(<boolean flag>), for example cy.skipOn(true)");
  }

  if (cb) {
    if (!flag) {
      return cb();
    }
  } else {
    cy.log(`skipOn **${flag}**`);

    if (flag) {
      skip();
    }
  }
};

/**
 * Skips the current test based on the browser, platform or url.
 * @param {string|boolean} name - condition, could be platform, browser name, url or true|false.
 * @param {() => void} [cb] - Optional, run the given callback if the condition does not pass
 */
export const skipOn = (name, cb) => {
  if (typeof name === "boolean") {
    return skipOnBool(name, cb);
  }

  if (typeof name !== "string") {
    throw new Error('Invalid syntax: cy.skipOn(<name>), for example cy.skipOn("linux")');
  }

  const normalizedName = normalizeName(name);

  if (cb) {
    if (isPlatform(normalizedName)) {
      if (Cypress.platform !== normalizedName) {
        return cb();
      }
      return;
    }

    if (isBrowser(normalizedName)) {
      if (!Cypress.isBrowser(normalizedName)) {
        return cb();
      }
      return it(`Skipping test(s) on ${normalizedName}`);
    }

    if (isHeadedName(normalizedName)) {
      if (!headedMatches(normalizedName)) {
        return cb();
      }
      return it(`Skipping test(s) in ${normalizedName} mode`);
    }

    if (isEnvironmentSet()) {
      if (!isEnvironment(normalizedName)) {
        return cb();
      }
      return it(`Skipping test(s) on ${normalizedName} environment`);
    }

    if (!matchesUrlPart(normalizedName)) {
      return cb();
    }
  } else {
    cy.log(`skipOn **${normalizedName}**`);

    if (isPlatform(normalizedName)) {
      if (Cypress.platform === normalizedName) {
        skip();
      }
      return;
    }

    if (isBrowser(normalizedName)) {
      if (Cypress.isBrowser(normalizedName)) {
        skip();
      }
      return;
    }

    if (isEnvironmentSet()) {
      if (isEnvironment(normalizedName)) {
        return skip();
      }
    }

    if (matchesUrlPart(normalizedName)) {
      return skip();
    }
  }
};

const onlyOnBool = (flag, cb) => {
  if (typeof flag !== "boolean") {
    throw new Error("Invalid syntax: cy.onlyOn(<boolean>), for example cy.onlyOn(true)");
  }

  if (cb) {
    if (flag) {
      return cb();
    }
  } else {
    cy.log(`onlyOn **${flag}**`);

    if (!flag) {
      skip();
    }
  }
};

/**
 * Runs the current test only in the specified browser, platform or against url.
 * @param {string|boolean} name - condition, could be platform, browser name, url or true|false.
 * @param {() => void} [cb] - Optional, run the given callback if the condition passes
 */
export const onlyOn = (name, cb) => {
  if (typeof name === "boolean") {
    return onlyOnBool(name, cb);
  }

  if (typeof name !== "string") {
    throw new Error('Invalid syntax: cy.onlyOn(<name>), for example cy.onlyOn("linux")');
  }

  if (cb) {
    if (isOn(name)) {
      return cb();
    } else {
      return it(`Skipping test(s), not on ${name}`);
    }
  } else {
    const normalizedName = normalizeName(name);
    cy.log(`onlyOn **${normalizedName}**`);
    if (!isOn(name)) {
      return skip();
    }
  }
};
