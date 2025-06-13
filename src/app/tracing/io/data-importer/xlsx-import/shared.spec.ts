import { getKeys } from "../../../util/non-ui-utils";
import { PartialPick } from "../../../util/utility-types";
import { IMPORT_ISSUES } from "./consts";
import { AddIssueCallback, ImportIssue, RefinedTypeString } from "./model";
import {
    getFormatedStrTime,
    getShortUniqueDeliveryIdFromLongId,
    getShortUniqueStationIdFromLongId,
    importAmount,
    importMandatoryString,
    importReference,
    importStringDate,
    importValue,
} from "./shared";
import { Row } from "./xlsx-reader";

interface Test {
    input: Omit<Row, "rowIndex">;
    expOutput: any;
    expIssues?: SheetImportIssue[];
}

type CellValue = string | number | boolean;
type SheetImportIssue = PartialPick<ImportIssue, "sheet">;

function runTests(
    tests: Test[],
    fun: (row: Row, cb: AddIssueCallback) => any,
): void {
    tests.forEach((test, iTest) => {
        it(`T${iTest}: ${value2Str(test.input)} => ${value2Str(test.expOutput)} (${test.expIssues?.length ?? 0} issues)`, () => {
            const obsIssues: SheetImportIssue[] = [];
            const addIssueCb: AddIssueCallback = (issue, invalidateRow) => {
                obsIssues.push(issue);
            };
            const row = { rowIndex: 0, ...test.input };

            const obsOutput = fun(row, addIssueCb);
            expect(obsOutput).toEqual(test.expOutput);
            expect(obsIssues).toEqual(
                expect.arrayContaining(
                    (test.expIssues ?? []).map((expIssue) =>
                        expect.objectContaining(expIssue),
                    ),
                ),
            );
        });
    });
}

function value2Str<T extends string | number>(
    value: { [key in T]?: CellValue | undefined } | CellValue | undefined,
): string {
    if (typeof value === "object") {
        const memberText = Object.keys(value)
            .filter((key) => value[key] !== undefined)
            .map((key) => `${key}: ${value2Str(value[key])}`)
            .join(", ");
        return memberText.length === 0 ? "{}" : `{ ${memberText} }`;
    }
    return typeof value === "string" ? JSON.stringify(value) : `${value}`;
}

describe("xls-import-shared", () => {
    describe("should import amounts correctly", () => {
        const COLS = { number: 0, unit: 1 };
        const tests: Test[] = [
            {
                input: { [COLS.number]: 5, [COLS.unit]: "kg" },
                expOutput: { number: 5, unit: "kg", text: "5 kg" },
            },
            {
                input: { [COLS.unit]: "kg" },
                expOutput: { text: "kg" },
                expIssues: [
                    { col: COLS.number, msg: IMPORT_ISSUES.missingValue },
                    {
                        col: COLS.unit,
                        msg: IMPORT_ISSUES.omittingValueBecauseOfAmountNumber,
                    },
                ],
            },
        ];
        const fun = (row: Row, cb: AddIssueCallback) =>
            importAmount(row, COLS, cb);
        runTests(tests, fun);
    });

    describe("should import dates correctly", () => {
        const COLS = { d: 0, m: 1, y: 2 } as const;

        const tests: Test[] = [
            {
                input: { [COLS.d]: 5, [COLS.m]: 1, [COLS.y]: 2004 },
                expOutput: "2004-01-05",
            },
            {
                input: { [COLS.d]: 32, [COLS.m]: 13, [COLS.y]: 2004 },
                expOutput: "2004",
                expIssues: [
                    { col: COLS.m, msg: IMPORT_ISSUES.invalidValue },
                    { col: COLS.d, msg: IMPORT_ISSUES.invalidValue },
                ],
            },
            {
                input: { [COLS.d]: 32, [COLS.m]: 8, [COLS.y]: 2004 },
                expOutput: "2004-08",
                expIssues: [{ col: COLS.d, msg: IMPORT_ISSUES.invalidValue }],
            },
            {
                input: { [COLS.d]: 30, [COLS.m]: 2, [COLS.y]: 2004 },
                expOutput: "2004-02",
                expIssues: [{ col: COLS.d, msg: IMPORT_ISSUES.invalidValue }],
            },
            {
                input: { [COLS.d]: 10 },
                expOutput: undefined,
                expIssues: [
                    {
                        col: COLS.d,
                        msg: IMPORT_ISSUES.omittingValueBecauseOfYear,
                    },
                ],
            },
            {
                input: { [COLS.d]: 10, [COLS.m]: 5 },
                expOutput: undefined,
                expIssues: [
                    {
                        col: COLS.m,
                        msg: IMPORT_ISSUES.omittingValueBecauseOfYear,
                    },
                    {
                        col: COLS.d,
                        msg: IMPORT_ISSUES.omittingValueBecauseOfYear,
                    },
                ],
            },
            {
                input: { [COLS.d]: 10, [COLS.y]: 2005 },
                expOutput: "2005",
                expIssues: [
                    {
                        col: COLS.d,
                        msg: IMPORT_ISSUES.omittingValueBecauseOfMonth,
                    },
                ],
            },
        ];
        const fun = (row: Row, cb: AddIssueCallback) =>
            importStringDate(row, COLS, cb);
        runTests(tests, fun);
    });

    describe("should format time correctly", () => {
        interface ShortTime {
            h: number;
            m: number;
            s?: number;
        }
        const tests: { input: ShortTime; expOutput: string | undefined }[] = [
            { input: { h: 8, m: 4, s: 3 }, expOutput: "08:04:03" },
            { input: { h: 8, m: 4 }, expOutput: "08:04" },
        ];

        for (let iTest = 0; iTest < tests.length; iTest++) {
            const test = tests[iTest];
            it(`T${iTest}: {${value2Str(test.input)}} => ${value2Str(test.expOutput)}`, () => {
                const obsOutput = getFormatedStrTime(
                    test.input.h,
                    test.input.m,
                    test.input.s,
                );
                expect(obsOutput).toEqual(test.expOutput);
            });
        }
    });

    describe("should generate unique ids", () => {
        const tests = [
            { context: "stations", fun: getShortUniqueStationIdFromLongId },
            { context: "deliveries", fun: getShortUniqueDeliveryIdFromLongId },
        ];
        const isArrayUnique = (arr) =>
            Array.isArray(arr) && new Set(arr).size === arr.length;

        for (const test of tests) {
            it(`for ${test.context}`, () => {
                const idsToExclude = new Set<string>();
                const uniqueIds: string[] = [];
                const LONG_IDS = ["A", "B", "C", "C"];
                LONG_IDS.forEach((longId) => {
                    const uniqueId = test.fun(longId, idsToExclude);
                    uniqueIds.push(uniqueId);
                    idsToExclude.add(uniqueId);
                });

                expect(isArrayUnique(uniqueIds)).toBeTruthy();
            });
        }
    });

    describe("should import mandatory string", () => {
        const tests: Test[] = [
            { input: { 0: "T" }, expOutput: "T" },
            {
                input: {},
                expOutput: undefined,
                expIssues: [{ col: 0, msg: IMPORT_ISSUES.missingValue }],
            },
        ];

        const fun = (row: Row, cb: AddIssueCallback) =>
            importMandatoryString(row, 0, cb);
        runTests(tests, fun);
    });

    describe("should import reference string", () => {
        const tests: Test[] = [
            {
                input: { 0: "" },
                expOutput: undefined,
                expIssues: [
                    {
                        col: 0,
                        msg: IMPORT_ISSUES.missingValue,
                        invalidatesRow: true,
                    },
                ],
            },
            {
                input: { 0: "K" },
                expOutput: "K",
                expIssues: [
                    {
                        col: 0,
                        msg: IMPORT_ISSUES.invalidRef,
                        invalidatesRow: true,
                    },
                ],
            },
            {
                input: { 0: "T" },
                expOutput: "T",
            },
        ];
        const knownRefs = new Set(["T"]);
        const fun = (row: Row, cb: AddIssueCallback) =>
            importReference(row, 0, knownRefs, cb);
        runTests(tests, fun);
    });

    describe("should import value correctly", () => {
        const type2InvValues: Partial<Record<RefinedTypeString, CellValue[]>> =
            {
                number: [NaN, "T", true],
                lat: [500],
                lon: [500],
                "nonneg:number": [-1],
                "pos:number": [0],
                boolean: [1, "T"],
            };

        const type2ValidValues: Partial<
            Record<RefinedTypeString, CellValue[]>
        > = {
            number: [1],
            lat: [13],
            lon: [15],
            "nonneg:number": [5],
            "pos:number": [5],
            boolean: [true],
            string: ["T"],
        };

        function getKeysWithNonEmptyValues(
            obj: Partial<Record<RefinedTypeString, CellValue[]>>,
        ): RefinedTypeString[] {
            return getKeys(obj).filter((key) => (obj[key] ?? []).length > 0);
        }

        const types = Array.from(
            new Set([
                ...getKeysWithNonEmptyValues(type2InvValues),
                ...getKeysWithNonEmptyValues(type2ValidValues),
            ]),
        );

        types.forEach((type) => {
            describe(`of type ${type}`, () => {
                const tests: Test[] = [
                    ...(type2InvValues[type] ?? []).map((value) => ({
                        input: { 0: value },
                        expOutput: undefined,
                        expIssues: [
                            { col: 0, msg: IMPORT_ISSUES.invalidValue },
                        ],
                    })),
                    ...(type2ValidValues[type] ?? []).map((value) => ({
                        input: { 0: value },
                        expOutput: value,
                    })),
                ];
                const fun = (row: Row, cb: AddIssueCallback) =>
                    importValue(row, 0, type, cb);
                runTests(tests, fun);
            });
        });

        describe(`which is missing but required`, () => {
            runTests(
                [
                    {
                        input: {},
                        expOutput: undefined,
                        expIssues: [
                            { col: 0, msg: IMPORT_ISSUES.missingValue },
                        ],
                    },
                ],
                (row, cb) => importValue(row, 0, "string", cb, true),
            );
        });
    });
});
