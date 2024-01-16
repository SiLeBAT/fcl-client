/* eslint-env es6 */
const { defaults: jestNgPreset } = require('jest-preset-angular/presets');

module.exports = {
    preset: "jest-preset-angular",
    roots: ['src'],
    setupFilesAfterEnv: ["<rootDir>/src/setup-jest.ts"],
    transform: { '^.+.(ts|mjs|js|html)$': 'jest-preset-angular' },
    transformIgnorePatterns: [
        "node_modules/(?!.*.mjs$|@ngrx|ol|mxgraph)"
    ],
    testPathIgnorePatterns: [
                './node_modules/',
                './dist/'
    ],
    moduleNameMapper: {
        // to allow require('...json')
        "^assets/(.*\\.json)$": "<rootDir>/src/assets/$1"
    },
    globals: {
        'ts-jest': {
            ...jestNgPreset.globals['ts-jest'],
            tsconfig: '<rootDir>/src/tsconfig.spec.json',
            diagnostics: {
                exclude: /\.(spec|test)\.ts$/,
                ignoreCodes: ['TS2349', 'TS2351', 'TS2304']
            }
        }
    }
}
