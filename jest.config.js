module.exports = {
	preset: "jest-preset-angular",
	roots: ['src'],
	setupFilesAfterEnv: ['./src/setup-jest.ts'],
    transform: { '^.+\\.(ts|js|html)$': 'ts-jest' },
    transformIgnorePatterns: [
        "node_modules/(?!@ngrx|ol|mxgraph)"
    ],
    testPathIgnorePatterns: [
        './node_modules/',
        './dist/',
        './src/test.ts'
    ],
    globals: {
        'ts-jest': {
            tsConfig: './src/tsconfig.spec.json',
            stringifyContentPathRegex: '\\.html$',
            astTransformers: ['./node_modules/jest-preset-angular/InlineHtmlStripStylesTransformer'],
            diagnostics: {
                pathRegex: /\.(spec|test)\.ts$/,
                ignoreCodes: ['TS2349', 'TS2351', 'TS2304']
            }
        }
    }
}
