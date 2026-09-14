/**
 * Plugin settings are public values read with Cypress.expose() (Cypress >= 15.10.0).
 *
 * Migration aid for Cypress 15.x only: a key missing from "expose" but still set in the deprecated "env"
 * is used anyway, with a warning shown once per key. Cypress.env() is never called on Cypress 16 (it always throws)
 * nor when allowCypressEnv is false (it logs a Cypress warning, then throws).
 */

const WARNINGS = "__cyApiOnelinerEnvWarnings";

const canReadLegacyEnv = () => parseInt(Cypress.version, 10) < 16 && Cypress.config("allowCypressEnv") === true && typeof Cypress.env === "function";

const readLegacyEnv = (key) => {
  if (!canReadLegacyEnv()) {
    return undefined;
  }
  try {
    return Cypress.env(key);
  } catch (error) {
    return undefined;
  }
};

const warnOnce = (key) => {
  // stored on the spec window so that the support file bundle and the spec file bundles share it
  const warnings = (window[WARNINGS] = window[WARNINGS] || { console: new Set(), commandLog: new Set() });
  const message = `"${key}" was read from Cypress.env(), which is deprecated since Cypress 15.10.0 and removed in Cypress 16: move "${key}" from "env" to "expose" in your Cypress configuration`;

  if (!warnings.console.has(key)) {
    warnings.console.add(key);
    console.warn(`cy-api-oneliner: ${message}`);
  }

  // the Command Log only exists while a test or a hook runs, not while spec files are collected
  if (!warnings.commandLog.has(key) && Cypress.currentTest) {
    try {
      Cypress.log({ name: "cy-api-oneliner", message, consoleProps: () => ({ key, migration: "https://github.com/aubincc/cy-api-oneliner#migrating-to-20" }) });
      warnings.commandLog.add(key);
    } catch (error) {
      // the console warning is enough when the Command Log cannot be written to
    }
  }
};

/**
 * Read a plugin setting from Cypress.expose(), falling back to the deprecated Cypress.env() on Cypress 15.x
 * @param {string} key the name of the setting
 * @returns {any} the value, or undefined when the setting is not configured
 */
export const readSetting = (key) => {
  if (typeof Cypress.expose !== "function") {
    throw new Error(`cy-api-oneliner requires Cypress >= 15.10.0: Cypress.expose() is not available to read "${key}"`);
  }

  const exposedValue = Cypress.expose(key);
  if (exposedValue !== undefined) {
    return exposedValue;
  }

  const legacyValue = readLegacyEnv(key);
  if (legacyValue !== undefined) {
    warnOnce(key);
  }
  return legacyValue;
};
