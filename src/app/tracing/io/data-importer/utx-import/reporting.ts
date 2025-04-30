import { error2Text } from "../json-validation/json-schema-validation";
import { ValidationError } from "../json-validation/model";
import { FIX_MSGS } from "./fix-utx-data/consts";
import { CleaningFix, ErrorFix, IssueFix } from "./fix-utx-data/model";

function isCleaningFix(fix: IssueFix): fix is CleaningFix {
    return (fix as CleaningFix).isCleaningFix;
}

function isErrorFix(fix: IssueFix): fix is ErrorFix {
    return !(fix as ErrorFix).isCleaningFix;
}

function preprocessIssueMsg<T extends IssueFix>(fix: T): T {
    if (!fix.isCleaningFix && fix.issueMsg) {
        return {
            ...fix,
            issueMsg: fix.issueMsg.replace(
                /(?<=^must NOT have) (unevaluated|additional)(?= property)/,
                "",
            ),
        };
    }
    return fix;
}

const fixPriorities: (typeof FIX_MSGS)[keyof typeof FIX_MSGS][] = [
    FIX_MSGS.renamed,
    FIX_MSGS.moved2SubTable,
    FIX_MSGS.arrayFlattened,
    FIX_MSGS.extracted,
    FIX_MSGS.converted2Array,
    FIX_MSGS.deleted,
    FIX_MSGS.corrected,
];

function issueFix2String(fix: IssueFix): string {
    return fix.isCleaningFix
        ? `Removed ${fix.cleanedValue}: ${fix.path}`
        : `Fixed schema violation (${fix.fixDetails ?? fix.fix}): '${fix.path} ${fix.issueMsg}'`;
}

function ignoredError2String(error: ValidationError): string {
    return `Ignored schema violation: '${error2Text(error)}'`;
}

function sortFixes(fixes: IssueFix[]): IssueFix[] {
    const cleanings = fixes.filter(isCleaningFix);
    const errorFixes = fixes.filter(isErrorFix);
    errorFixes.sort((fix1, fix2) => {
        let prioFix1 = fixPriorities.indexOf(fix1.fix as any);
        if (prioFix1 === -1) {
            prioFix1 = fixPriorities.length;
        }
        let prioFix2 = fixPriorities.indexOf(fix2.fix as any);
        if (prioFix2 === -1) {
            prioFix2 = fixPriorities.length;
        }
        let result = prioFix1 - prioFix2;
        if (result === 0) {
            result = fix1.fix.localeCompare(fix2.fix);
            if (result === 0) {
                result = (fix1.fixDetails ?? "").localeCompare(
                    fix2.fixDetails ?? "",
                );
                if (result === 0) {
                    result = fix1.path.localeCompare(fix2.path);
                    if (result === 0) {
                        result = (fix1.issueMsg ?? "").localeCompare(
                            fix2.issueMsg ?? "",
                        );
                    }
                }
            }
        }
        return result;
    });
    return [...cleanings, ...errorFixes];
}

function fixes2Strings(fixes: IssueFix[]): string[] {
    const preprocessedFixes = fixes.map(preprocessIssueMsg);
    const sortedFixes = sortFixes(preprocessedFixes);
    return sortedFixes.map(issueFix2String);
}

function sortErrors(errors: ValidationError[]): ValidationError[] {
    return errors.slice().sort((error1, error2) => {
        let result = (error1.message ?? "").localeCompare(error2.message ?? "");
        if (result === 0) {
            result = error1.instancePath.localeCompare(error2.instancePath);
        }
        return result;
    });
}

function ignoredErrors2Strings(errors: ValidationError[]): string[] {
    return sortErrors(errors).map(ignoredError2String);
}

export function fixesAndIgnoredErrors2Strings(
    fixes: IssueFix[] | undefined,
    errors: ValidationError[] | undefined,
): string[] | undefined {
    if (
        fixes === undefined ||
        fixes.length === 0 ||
        errors === undefined ||
        errors.length === 0
    ) {
        return undefined;
    }
    return [
        ...fixes2Strings(fixes ?? []),
        ...ignoredErrors2Strings(errors ?? []),
    ];
}
