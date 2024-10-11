const MAX_YEAR = 9999;
const MIN_YEAR = 1000;
const MAX_MONTH = 12;
const FEBRUARY = 2;
const MAX_FEBRUARY_DAY = 29;
const MAX_NON_LEAP_YEAR_FEBRUARY_DAY = 28;
const MAX_DAY = 31;
const MONTHS_WITH_31_DAYS = [1, 3, 5, 7, 8, 10, 12];

export function isMonthValid(month: number): boolean {
    return Number.isSafeInteger(month) && month > 0 && month <= MAX_MONTH;
}

export function isYearValid(year: number): boolean {
    return Number.isSafeInteger(year) && year >= MIN_YEAR && year <= MAX_YEAR;
}

export function isLeapYear(year: number): boolean {
    return (
        isYearValid(year) &&
        ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)
    );
}

export function isDayValid(
    day: number,
    month?: number,
    year?: number,
): boolean {
    return (
        Number.isSafeInteger(day) &&
        day > 0 &&
        day <= MAX_DAY &&
        (month === undefined ||
            day <= MAX_NON_LEAP_YEAR_FEBRUARY_DAY ||
            (month !== FEBRUARY && day < MAX_DAY) ||
            (day <= MAX_FEBRUARY_DAY &&
                (year === undefined || isLeapYear(year))) ||
            MONTHS_WITH_31_DAYS.includes(month))
    );
}
