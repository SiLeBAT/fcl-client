import { ValidationError } from "../json-schema-validation";

type FixIssueHandler = (data: any, issue: ValidationError) => void;

const VALIDATION_ERROR_MSGS = {
    mustBeArray: "must be array",
    mustBeGreaterThanZero: "must be > 0",
    mustMatchEmail: `must match format "email"`,
    unevaluatedProperty: "must NOT have unevaluated properties",
    mustBeObject: "must be object",
} as const;

const RASFFNOTIFICATION_INSTANCEPATH_REGEXP =
    /^\/utxCore\/investigation\/current\/\d+\/rasffNotifications\/\d+$/;

function cleanObject(obj: any): void {
    if (typeof obj === "object") {
        for (const key of Object.keys(obj)) {
            const value = obj[key];
            if (value === "NA") {
                delete obj[key];
            } else if (isEmptyArray(value)) {
                delete obj[key];
            } else if (typeof value === "object") {
                cleanObject(value);
            }
        }
    }
}

function isEmptyArray(obj: any | never[]): obj is never[] {
    return Array.isArray(obj) && obj.length === 0;
}

function cleanData(data: any): any {
    const cleanedData = JSON.parse(JSON.stringify(data));
    cleanObject(cleanedData.utxCore);
    return cleanedData;
}

function getObjAndProperty(
    data: any,
    path: string,
    pathSuffixIsProperty: boolean = true,
): { obj: any; property: string | undefined } {
    const pathElements = path.split("/").slice(1);
    const propertyName = pathSuffixIsProperty ? pathElements.pop() : undefined;
    const obj = getObjectFromPath(data, pathElements);
    return { obj: obj, property: propertyName };
}

const issueHandler: Record<string, FixIssueHandler> = {
    [VALIDATION_ERROR_MSGS.mustBeArray]: (data, issue) => {
        const { obj, property } = getObjAndProperty(data, issue.instancePath);
        if (property && typeof obj?.[property] === "string") {
            obj[property] = [obj[property]];
        }
    },
    [VALIDATION_ERROR_MSGS.mustBeGreaterThanZero]: (data, issue) => {
        const { obj, property } = getObjAndProperty(data, issue.instancePath);
        if (
            property &&
            typeof obj?.[property] === "number" &&
            obj[property] <= 0
        ) {
            delete obj[property];
        }
    },
    [VALIDATION_ERROR_MSGS.mustMatchEmail]: (data, issue) => {
        const { obj, property } = getObjAndProperty(data, issue.instancePath);
        if (property && obj?.[property] !== undefined) {
            delete obj[property];
        }
    },
    [VALIDATION_ERROR_MSGS.unevaluatedProperty]: (data, issue) => {
        const { obj } = getObjAndProperty(data, issue.instancePath, false);
        const property = issue.params.unevaluatedProperty;
        if (property && obj?.[property] !== undefined) {
            delete obj[property];
        }
    },
    [VALIDATION_ERROR_MSGS.mustBeObject]: (data, issue) => {
        if (!RASFFNOTIFICATION_INSTANCEPATH_REGEXP.test(issue.instancePath)) {
            return;
        }
        const { obj, property } = getObjAndProperty(data, issue.instancePath);
        if (
            property &&
            Array.isArray(obj?.[property]) &&
            obj[property].length === 1
        ) {
            obj[property] = obj[property][0];
        }
    },
};

function getObjectFromPath(data: any, path: string[]): any {
    return path.reduce((pV, cV) => pV?.[cV], data);
}

export function fixUtxData(data: any, issues: ValidationError[]): any {
    const cleanedData = cleanData(data);
    issues.forEach((issue) => {
        const fixIssueHandler = issueHandler[issue.message];
        if (fixIssueHandler !== undefined && issue.instancePath !== undefined) {
            fixIssueHandler(cleanedData, issue);
        }
    });
    return cleanedData;
}
