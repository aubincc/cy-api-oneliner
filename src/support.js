/// <reference types="@bahmutov/cy-api" />

const pathToPathArray = (str) => {
  if (Array.isArray(str)) {
    return str;
  }

  let result = [];
  let currentString = "";

  for (let i = 0; i < str.length; i++) {
    const currentChar = str.charAt(i);
    if (currentChar === "." || currentChar === "[" || currentChar === "]") {
      if (currentString !== "") {
        result.push(currentString);
        currentString = "";
      }

      if (currentChar === "[") {
        const endBracketIndex = str.indexOf("]", i + 1);
        const arrayIndex = str.substring(i + 1, endBracketIndex);
        if (/^\d+$/.test(arrayIndex)) {
          result.push(parseInt(arrayIndex));
        } else {
          result.push(arrayIndex);
        }
        i = endBracketIndex;
      }
    } else {
      currentString += currentChar;
    }
  }

  if (currentString !== "") {
    result.push(currentString);
  }

  return result;
};

const pathArrayToValue = (obj, path) => {
  if (typeof path === "string") {
    path = path.split(".");
  }
  if (path.length === 0) {
    return obj;
  }
  const key = path[0];
  const index = parseInt(key);
  if (Array.isArray(obj) && !isNaN(index)) {
    obj = obj[index];
  } else {
    obj = obj[key];
  }
  if (obj === undefined) {
    return path.join(".");
  }
  const remainingKeys = path.slice(1);
  return pathArrayToValue(obj, remainingKeys);
};

const extractAliasAndNestedKey = (value) => {
  const atSignIndex = value.indexOf("@");
  if (atSignIndex === -1) {
    return { aliasName: value, nestedKey: null };
  }

  let aliasName = "";
  let nestedKey = null;
  let i = atSignIndex + 1;
  while (i < value.length) {
    const char = value[i];
    if (char === ".") {
      if (nestedKey === null) {
        aliasName = value.substring(atSignIndex + 1, i);
        nestedKey = value.substring(i);
      } else {
        nestedKey += `.${value.substring(i + 1)}`;
      }
      break;
    } else if (char === "[") {
      const closingBracketIndex = value.indexOf("]", i);
      if (closingBracketIndex === -1) {
        nestedKey = value.substring(i);
        break;
      }
      if (nestedKey === null) {
        aliasName = value.substring(atSignIndex + 1, i);
        nestedKey = value.substring(i, closingBracketIndex + 1);
      } else {
        nestedKey += value.substring(i, closingBracketIndex + 1);
      }
      i = closingBracketIndex;
    } else if (i === value.length - 1) {
      if (nestedKey === null) {
        aliasName = value.substring(atSignIndex + 1);
      } else {
        nestedKey += `.${value.substring(i + 1)}`;
      }
    }
    i++;
  }
  if (nestedKey !== null && nestedKey[0] === ".") {
    nestedKey = nestedKey.substring(1);
  }
  return { aliasName, nestedKey };
};

const replaceAliasWithValue = (value) => {
  const { aliasName, nestedKey } = extractAliasAndNestedKey(value);
  const aliasData = localStorage.getItem(aliasName);

  // Check if value could be an alias with a path
  try {
    const parsedData = JSON.parse(aliasData);
    if (typeof parsedData === "object" && parsedData !== null) {
      if (nestedKey) {
        return pathArrayToValue(parsedData, pathToPathArray(nestedKey));
      } else {
        return parsedData;
      }
    }
  } catch (e) {}

  // Check if the value is surrounded by quotes
  if (/^".*"$/.test(aliasData) || /^'.*'$/.test(aliasData)) {
    return aliasData.slice(1, -1);
  }

  // Check if the value is a reserved word
  if (["true", "false", "null"].includes(aliasData)) {
    return JSON.parse(aliasData);
  }

  // Check if the value is a number
  if (!isNaN(aliasData)) {
    return Number(aliasData);
  }

  // If none of the above conditions match, return the original string
  return value;
};

const replaceAliasesWithValues = (params) => {
  return Object.entries(params).reduce((result, [key, value]) => {
    return {
      ...result,
      [key]: typeof value === "string" && value.startsWith("@") ? replaceAliasWithValue(value) : value,
    };
  }, {});
};

/**
 * Make the requestBuilder function
 */

const requestBuilder = (config) => {
  let responseAlias = null;
  let aliasPath;
  let requestParams = {};
  let requestUrlParams = {};
  let requestBodyParams = {};
  let responseBodyAssertions = [];
  let responseStatusCode = "";
  let authCredentials = {};

  const buildConfig = () => {
    const { method, url } = config;
    const builtConfig = { method, url };

    if (requestParams) {
      builtConfig.url = Object.entries(requestParams).reduce((builtUrl, [key, value]) => {
        if (typeof value === "string" && value.startsWith("@")) {
          const [alias, ...pathString] = value.slice(1).split(".");
          pathString = pathString.join("."); // weird fix
          const aliasValue = localStorage.getItem(alias);
          if (!aliasValue) {
            return "ALIAS_NOT_FOUND";
          }
          const parsedValue = JSON.parse(aliasValue);
          const resolvedValue = pathArrayToValue(parsedValue, pathToPathArray(pathString));
          if (pathString === resolvedValue) {
            return "ALIAS_FOUND_BUT_NOT_PATH_TO_KEY";
          }
          value = resolvedValue;
        }

        return builtUrl.replace(`:${key}`, value.toString());
      }, url);
    }

    if (Object.keys(requestBodyParams).length) {
      const resolvedBodyParams = replaceAliasesWithValues(requestBodyParams);

      builtConfig.body = resolvedBodyParams;
    }

    if (Object.keys(requestUrlParams).length) {
      const resolvedUrlParams = replaceAliasesWithValues(requestUrlParams);

      builtConfig.qs = { ...builtConfig.qs, ...resolvedUrlParams };
    }

    builtConfig.failOnStatusCode = false; // forced for the time being

    return builtConfig;
  };

  const buildTitle = () => {
    const { method, url } = config;
    const builtTitleObj = {};

    let titleString = `${method} ${url}`; // (refreshable currentTest.title? not yet!)

    if (Object.keys(requestParams).length) {
      builtTitleObj.endpointParams = JSON.stringify(requestParams);
      titleString = titleString.concat("\n » ", "params: ", builtTitleObj.endpointParams);
    }

    if (Object.keys(requestBodyParams).length) {
      builtTitleObj.bodyParams = JSON.stringify(requestBodyParams);
      titleString = titleString.concat("\n » ", "body params: ", builtTitleObj.bodyParams);
    }

    if (Object.keys(requestUrlParams).length) {
      builtTitleObj.queryParams = JSON.stringify(requestUrlParams);
      titleString = titleString.concat("\n » ", "query params: ", builtTitleObj.queryParams);
    }

    const builtTitle = titleString;

    return builtTitle;
  };

  const buildStatusAssertions = () => {
    let builtStatusAssertions = [];
    if (responseStatusCode !== "") {
      // QUESTION: "Has Cypress.env("ONELINER_API_STATUS_CODE_NAMES") been configured?"
      // https://github.com/aubincc/cy-api-oneliner#cypress-environment-variables
      const resolvedResponseStatusAssertions = Cypress.env("ONELINER_API_STATUS_CODE_NAMES")[responseStatusCode] || {};
      if (Object.keys(resolvedResponseStatusAssertions).length) {
        builtStatusAssertions = Object.entries(resolvedResponseStatusAssertions).map(([key, value]) => {
          const obj = {};
          obj[key] = value;
          return obj;
        });
      }
    }
    return builtStatusAssertions;
  };

  const buildAssertions = () => {
    let builtAssertions = [];
    if (Object.keys(responseBodyAssertions).length) {
      const resolvedResponseBodyAssertions = replaceAliasesWithValues(responseBodyAssertions);
      builtAssertions = Object.entries(resolvedResponseBodyAssertions).map(([key, value]) => {
        const obj = {};
        obj[key] = value;
        return obj;
      });
    }
    return builtAssertions;
  };

  const buildAuthHeaders = (authType) => {
    const resolvedAuthCredentials = replaceAliasWithValue(authCredentials);

    switch (authType) {
      case "No Auth":
        return {};

      case "API Key":
        const apiKeyHeader = {};
        apiKeyHeader[resolvedAuthCredentials.name || "X-API-Key"] = resolvedAuthCredentials.value;
        return apiKeyHeader;

      case "Bearer Token":
        return { Authorization: `Bearer ${resolvedAuthCredentials}` };

      case "Basic Auth":
        // authCredentials value should be like "username:password"
        const [username, password] = resolvedAuthCredentials.value.split(":");
        const resolvedUsername = replaceAliasWithValue(username);
        const resolvedPassword = replaceAliasWithValue(password);
        const credentials = Buffer.from(`${resolvedUsername}:${resolvedPassword}`, "utf-8").toString("base64");
        const basicAuthHeader = { Authorization: `Basic ${credentials}` };
        return basicAuthHeader;

      default:
        // return {};
        throw new Error(`Yet unsupported authentication type: ${authType}`);
    }
  };

  /**
   * Executes the test
   * @param mode if "inHook", allows the function to be ran in Cypress hooks
   */
  const executeRequest = (mode) => () => {
    // QUESTION: "Has Cypress.env("ONELINER_API_AUTH_TYPE") been configured?"
    // https://github.com/aubincc/cy-api-oneliner#cypress-environment-variables
    const authType = Cypress.env("ONELINER_API_AUTH_TYPE") || "No Auth";
    // QUESTION: "Has Cypress.env("ONELINER_API_AUTH_TYPE") been configured?"
    // https://github.com/aubincc/cy-api-oneliner#cypress-environment-variables
    const authLocation = Cypress.env("ONELINER_API_AUTH_CREDENTIALS_LOCATION") || "header";

    const testTitle = buildTitle();

    if (mode === "inHook") {
      cy.log(testTitle).then(() => {
        const requestOptions = {};
        if (Object.keys(authCredentials).length) {
          if (authType !== "No Auth") {
            if (authLocation === "header") {
              requestOptions.headers = buildAuthHeaders(authType);
            } else {
              if (authCredentials.name && authCredentials.value) {
                requestOptions.qs = { ...requestOptions.qs, ...{ [authCredentials.name]: authCredentials.value } };
              }
            }
          }
        }

        cy.api({ ...buildConfig(), ...requestOptions })
          .then((response) => {
            buildStatusAssertions().forEach((obj) => {
              const [key, value] = Object.entries(obj)[0];
              expect(response, `[[ ${key} = ${value} ]] \n`).to.have.deep.nested.property(key, value);
            });
            return response;
          })
          .then((response) => {
            if (responseAlias) {
              // QUESTION: "Has Cypress.env("ONELINER_DEFAULT_PATH_FOR_ALIAS") been configured?"
              // https://github.com/aubincc/cy-api-oneliner#cypress-environment-variables
              aliasPath = aliasPath || Cypress.env("ONELINER_DEFAULT_PATH_FOR_ALIAS") || "body";
              const savedData = pathArrayToValue(response, pathToPathArray(aliasPath));
              localStorage.setItem(responseAlias, JSON.stringify(savedData));
            }
            return response;
          })
          .then((response) => {
            buildAssertions().forEach((obj) => {
              const [key, value] = Object.entries(obj)[0];
              expect(response, `[[ ${key} = ${value} ]] \n`).to.have.deep.nested.property(key, value);
            });
            return response;
          });
      });
    } else {
      it(testTitle, () => {
        executeRequest("inHook")();
      });
    }
  };

  const requestBuilder = {
    send: (mode) => {
      if (mode === "inHook") {
        executeRequest("inHook")();
      } else {
        executeRequest()();
      }
    },

    alias: (name, pathToSavedValue) => {
      responseAlias = name;
      aliasPath = pathToSavedValue;
      return requestBuilder;
    },

    params: (params) => {
      requestParams = params;
      return requestBuilder;
    },

    urlparams: (urlparams) => {
      requestUrlParams = urlparams;
      return requestBuilder;
    },

    bodyparams: (bodyparams) => {
      requestBodyParams = bodyparams;
      return requestBuilder;
    },

    status: (statusCode) => {
      responseStatusCode = statusCode;
      return requestBuilder;
    },

    check: (assertionObject) => {
      responseBodyAssertions = assertionObject;
      return requestBuilder;
    },

    session: (credentials) => {
      authCredentials = credentials || {};
      return requestBuilder;
    },
  };

  return requestBuilder;
};

/**
 * Export one function for each method available
 */

export const GET = (url) => requestBuilder({ method: "GET", url });
export const POST = (url) => requestBuilder({ method: "POST", url });
export const PUT = (url) => requestBuilder({ method: "PUT", url });
export const DELETE = (url) => requestBuilder({ method: "DELETE", url });
export const OPTIONS = (url) => requestBuilder({ method: "OPTIONS", url });
export const HEAD = (url) => requestBuilder({ method: "HEAD", url });
export const PATCH = (url) => requestBuilder({ method: "PATCH", url });
