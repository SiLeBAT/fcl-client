import {
    AJV_VALIDATION_ERROR_MSGS,
    VALIDATION_ERROR_MSGS,
} from "../../json-validation/consts";
import { ValidationError } from "../../json-validation/model";
import { cleanData } from "./clean-data";
import {
    FixIssueHandler,
    mustBeArrayHandler,
    mustBeObjectHandler,
    mustBeOfTypeHandler,
    mustNotHaveAdditionalPropertiesHandler,
    unevaluatedPropertyHandler,
} from "./fix-issue-handler";
import { IssueFix } from "./model";

const msg2IssueHandler: Record<string, FixIssueHandler> = {
    [AJV_VALIDATION_ERROR_MSGS.mustBeArray]: mustBeArrayHandler,
    [AJV_VALIDATION_ERROR_MSGS.mustBeObject]: mustBeObjectHandler,
    [AJV_VALIDATION_ERROR_MSGS.mustNotHaveAdditionalProperties]:
        mustNotHaveAdditionalPropertiesHandler,
};

const otherIssueHandlers: {
    msg?: RegExp | string;
    path?: RegExp;
    handler: FixIssueHandler;
}[] = [
    {
        msg: VALIDATION_ERROR_MSGS.mustNotHaveUnevaluatedPropertyRegex,
        handler: unevaluatedPropertyHandler,
    },
    {
        msg: VALIDATION_ERROR_MSGS.mustBeOfTypeRegex,
        handler: mustBeOfTypeHandler,
    },
];

export function fixUtxData(
    data: any,
    issues: ValidationError[],
): { fixedData: any; fixes: IssueFix[] } {
    const { cleanedData, cleaningFixes } = cleanData(data);
    const issueFixes: IssueFix[] = [];
    const addIssueFixCb = (issueFix: IssueFix) => issueFixes.push(issueFix);
    issues.forEach((issue) => {
        if (issue.message) {
            let fixIssueHandler: FixIssueHandler | undefined =
                msg2IssueHandler[issue.message];
            fixIssueHandler ??= otherIssueHandlers.find((x) => {
                const result =
                    (!x.msg ||
                        x.msg === issue.message ||
                        (typeof x.msg === "object" &&
                            x.msg.test(issue.message!))) &&
                    (!x.path || x.path.test(issue.instancePath));
                return result;
            })?.handler;
            if (
                fixIssueHandler !== undefined &&
                issue.instancePath !== undefined
            ) {
                fixIssueHandler(cleanedData, issue, addIssueFixCb);
            }
        }
    });
    const fixes = [...cleaningFixes, ...issueFixes];

    return {
        fixedData: cleanedData,
        fixes: fixes,
    };
}
