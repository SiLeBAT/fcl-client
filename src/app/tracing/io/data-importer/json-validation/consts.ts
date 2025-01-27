export const AJV_VALIDATION_ERROR_MSGS = {
    mustBeArray: "must be array",
    mustBeGreaterThanZero: "must be > 0",
    mustMatchEmail: `must match format "email"`,
    mustMatchUri: `must match format "uri"`,
    unevaluatedProperties: "must NOT have unevaluated properties",
    mustBeObject: "must be object",
    mustMatchPatternPrefix: "must match pattern",
    mustMatchPatternRegex: /^must match pattern.*$/,
    mustNotHaveAdditionalProperties: "must NOT have additional properties",
    mustNotHaveUnevaluatedPropertyRegex:
        /^must NOT have unevaluated property "[^"]*"$/,
} as const;

export const VALIDATION_ERROR_MSGS = {
    mustBeOfTypeRegex: /^must be of type "([^"]+)"$/,
    dataViolateSchema: `The data violate the expected schema.`,
    mustNotHaveUnevaluatedProperty: (property: string) =>
        `must NOT have unevaluated property "${property}"`,
    mustNotHaveUnevaluatedPropertyRegex:
        /^must NOT have unevaluated property "([^"]*)"$/,
    mustBeOfType: (name: string) => `must be of type "${name}"`,
    mustNotHaveAdditionalProperty: (name: string) =>
        `must NOT have additional property "${name}"`,
} as const;
