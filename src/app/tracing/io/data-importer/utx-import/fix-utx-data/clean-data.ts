import { CleaningFix } from "./model";

const NA = "NA";
const UTXCORE = "utxCore";

const createNACleaningFix = (instancePath: string) => ({
    path: instancePath,
    isCleaningFix: true as const,
    cleanedValue: `"NA"`,
});

function cleanObject(
    obj: any,
    path: string,
    addCleaningFixCb: (fix: CleaningFix) => void,
): void {
    if (Array.isArray(obj)) {
        obj.forEach((item, index) =>
            cleanObject(item, `${path}/${index}`, addCleaningFixCb),
        );
    } else if (typeof obj === "object") {
        for (const key of Object.keys(obj)) {
            const value = obj[key];
            if (value === NA) {
                addCleaningFixCb(createNACleaningFix(`${path}/${key}`));
                delete obj[key];
            } else {
                cleanObject(value, `${path}/${key}`, addCleaningFixCb);
            }
        }
    }
}

export function cleanData(data: any): {
    cleanedData: any;
    cleaningFixes: CleaningFix[];
} {
    const cleanedData = JSON.parse(JSON.stringify(data));
    const cleaningFixes: CleaningFix[] = [];
    const addCleaningFixCb = (fix: CleaningFix) => cleaningFixes.push(fix);
    cleanObject(cleanedData.utxCore, `/${UTXCORE}`, addCleaningFixCb);
    return { cleanedData, cleaningFixes };
}
