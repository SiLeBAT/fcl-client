import { Row } from "../xlsx-reader";
import { StationColumn } from "./model";
import { createStationAddress } from "./station-import";

describe("station-import", () => {
    it("should create station address correctly", () => {
        const tests: {
            input: Omit<Row, "rowIndex">;
            expOutput: string | undefined;
        }[] = [
            {
                input: {
                    [StationColumn.STREET]: "Traumallee",
                    [StationColumn.STREET_NUMBER]: 625,
                    [StationColumn.CITY]: "Berlin",
                    [StationColumn.ZIP]: 12345,
                },
                expOutput: "Traumallee 625, 12345 Berlin",
            },
            {
                input: {
                    [StationColumn.CITY]: "Berlin",
                    [StationColumn.ZIP]: 12345,
                },
                expOutput: "12345 Berlin",
            },
            {
                input: {
                    [StationColumn.STREET]: "Traumallee",
                    [StationColumn.STREET_NUMBER]: 625,
                },
                expOutput: "Traumallee 625",
            },
            {
                input: {},
                expOutput: undefined,
            },
        ];

        tests.forEach((test) => {
            const input = JSON.stringify(test.input);
            const obsOutput = createStationAddress({
                rowIndex: 0,
                ...test.input,
            });
            expect({ in: input, out: obsOutput }).toEqual({
                in: input,
                out: test.expOutput,
            });
        });
    });
});
