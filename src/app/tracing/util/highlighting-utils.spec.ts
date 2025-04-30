import { convertIndexToLetterCode } from "./highlighting-utils";

const EXPECTED_CONVERSIONS: { from: number; to: string }[] = [
    { from: 1, to: "A" },
    { from: 2, to: "B" },
    { from: 26, to: "Z" },
    { from: 27, to: "AA" },
    { from: 28, to: "AB" },
    { from: 52, to: "AZ" },
    { from: 53, to: "BA" },
    { from: 26 * 26 + 26, to: "ZZ" },
    { from: 26 * 26 + 26 + 1, to: "AAA" },
    { from: 26 * 26 + 26 + 2, to: "AAB" },
    { from: 26 * 26 + 26 + 27, to: "ABA" },
];

describe("highlighting-utils", () => {
    describe("should convert oneBasedIndex to letter code", () => {
        EXPECTED_CONVERSIONS.forEach(({ from, to }) => {
            it(`should convert ${from} to "${to}"`, () => {
                expect(convertIndexToLetterCode(from)).toBe(to);
            });
        });
    });
});
