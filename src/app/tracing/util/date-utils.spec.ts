import { isDayValid, isMonthValid, isYearValid } from "./date-utils";
const INVALID_YEARS = [NaN, Number.MAX_SAFE_INTEGER, 0, 3.4];
const VALID_YEARS = [1000, 9999];
const INVALID_MONTHS = [NaN, Number.MAX_SAFE_INTEGER, -1, 2.3];
const VALID_MONTHS = [...Array(12).keys()].map((month) => month + 1);
const AVAILABLE_DAYS = [...Array(31).keys()].map((day) => day + 1);
const MONTHS_WITH_31_DAYS = [1, 3, 5, 7, 8, 10, 12];
const NON_LEAP_YEARS = [1900, 2001];
const LEAP_YEARS = [2024, 2000];

const INVALID_DATES: { day: number; month?: number; year?: number }[] = [
    ...[NaN, -1, 32, 0.45].map((day) => ({ day: day })),
    ...VALID_MONTHS.filter((m) => !MONTHS_WITH_31_DAYS.includes(m)).map(
        (month) => ({ day: 31, month: month }),
    ),
    ...NON_LEAP_YEARS.map((year) => ({ day: 29, month: 2, year: year })),
];

const VALID_DATES: { day: number; month?: number; year?: number }[] = [
    ...AVAILABLE_DAYS.map((day) => ({ day: day })),
    ...MONTHS_WITH_31_DAYS.map((month) => ({ day: 31, month: month })),
    { day: 29, month: 2 },
    ...LEAP_YEARS.map((year) => ({ day: 29, month: 2, year: year })),
];

describe("date-utils", () => {
    describe("should detect invalid years", () => {
        INVALID_YEARS.forEach((year) => {
            it(`accepts ${year} as a invalid year`, () => {
                expect(isYearValid(year)).toBe(false);
            });
        });
    });

    describe("should detect valid years", () => {
        VALID_YEARS.forEach((year) => {
            it(`accepts ${year} as a valid year`, () => {
                expect(isYearValid(year)).toBe(true);
            });
        });
    });

    describe("should detect invalid months", () => {
        INVALID_MONTHS.forEach((month) => {
            it(`accepts ${month} as a invalid month`, () => {
                expect(isMonthValid(month)).toBe(false);
            });
        });
    });

    describe("should detect valid months", () => {
        VALID_MONTHS.forEach((month) => {
            it(`accepts ${month} as a valid month`, () => {
                expect(isMonthValid(month)).toBe(true);
            });
        });
    });

    describe("should detect invalid days", () => {
        INVALID_DATES.forEach((date) => {
            it(`assesses ${JSON.stringify(date)} as a invalid day`, () => {
                expect(isDayValid(date.day, date.month, date.year)).toBe(false);
            });
        });
    });

    describe("should detect valid days", () => {
        VALID_DATES.forEach((date) => {
            it(`assesses ${JSON.stringify(date)} as a valid day`, () => {
                expect(isDayValid(date.day, date.month, date.year)).toBe(true);
            });
        });
    });
});
