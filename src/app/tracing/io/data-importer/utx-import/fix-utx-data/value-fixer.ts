function ignoreNA(value: string | undefined): string | undefined {
    return value === "NA" ? undefined : value;
}

function convertToIncompleteDateTime(
    value: string,
    omitTime: boolean = false,
): string | undefined {
    const regex =
        /^(\d{4})(-(\d{1,2}|NA)(-(\d{1,2}|NA)( (\d{1,2})(:(\d{1,2}))?)?)?)?$/;
    const match = value.match(regex);
    if (match) {
        const partialDateTime = {
            year: match[1],
            month: ignoreNA(match[3]),
            day: ignoreNA(match[5]),
            hour: ignoreNA(match[7]),
            minute: ignoreNA(match[9]),
        };
        let result = partialDateTime.year;
        if (partialDateTime.month) {
            result += `-${partialDateTime.month.padStart(2, "0")}`;
        }
        if (partialDateTime.day) {
            result += `-${partialDateTime.day.padStart(2, "0")}`;
        }
        if (!omitTime) {
            if (partialDateTime.hour) {
                result += ` ${partialDateTime.hour.padStart(2, "0")}`;
            }
            if (partialDateTime.minute) {
                result += `:${partialDateTime.minute.padStart(2, "0")}`;
            }
        }
        return result;
    }
    return undefined;
}

function convertToIncompleteDuration(
    value: string,
    omitTime: boolean = false,
): string | undefined {
    const regex = /^(\d{1,2})(-(\d{1,2})( (\d{1,2})(:(\d{1,2}))?)?)?$/;
    const match = value.match(regex);
    if (match) {
        const partialDuration = {
            months: match[1],
            days: match[3],
            hours: match[5],
            minutes: match[7],
        };
        let result = partialDuration.months.padStart(2, "0");
        if (partialDuration.days) {
            result += `-${partialDuration.days.padStart(2, "0")}`;
        }
        if (!omitTime) {
            if (partialDuration.hours) {
                result += ` ${partialDuration.hours.padStart(2, "0")}`;
            }
            if (partialDuration.minutes) {
                result += `:${partialDuration.minutes.padStart(2, "0")}`;
            }
        }
        return result;
    }
    return undefined;
}

export const ValueType2FixFunction = {
    Date: (x: string) => convertToIncompleteDateTime(x, true),
    DateTime: convertToIncompleteDateTime,
    Duration1: (x: string) => convertToIncompleteDuration(x, true),
    Duration2: convertToIncompleteDuration,
};
