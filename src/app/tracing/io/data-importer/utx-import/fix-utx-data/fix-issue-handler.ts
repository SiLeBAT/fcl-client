import {
    getValueFromPath,
    isObject,
} from "../../../../../tracing/util/non-ui-utils";
import { VALIDATION_ERROR_MSGS } from "../../json-validation/consts";
import { ValidationError } from "../../json-validation/model";
import { isObjectSchema } from "../../json-validation/schema-query";
import { FIXDETAIL_MSGS, FIX_MSGS } from "./consts";
import { IssueFix } from "./model";
import { ValueType2FixFunction } from "./value-fixer";

type FixCreator = (instancePath: string, issueMsg: string) => IssueFix;

const REGEXPS = {
    ACTIVITY_INSTANCEPATH: /^\/utxCore\/activity\/(current|history)\/\d+$/,
    STATION_OR_FBO_INSTANCEPATH:
        /^\/utxCore\/(station|fbo)\/(current|history)\/\d+$/,
    TRU_INSTANCEPATH: /^\/utxCore\/tru\/(current|history)\/\d+$/,
    REGISTRATION_PROPS: /^registration(Scheme|Number|Type)$/,
};

const createFix = (
    iP: string,
    issueMsg: string,
    fix: string,
    fixDetails?: string,
) => ({
    path: iP,
    issueMsg: issueMsg,
    fix: fix,
    fixDetails: fixDetails,
});
const createDeletionFix: FixCreator = (iP, issueMsg) =>
    createFix(iP, issueMsg, FIX_MSGS.deleted);
const createArrayConversionFix: FixCreator = (iP, issueMsg) =>
    createFix(iP, issueMsg, FIX_MSGS.converted2Array);
const createArrayFlatteningFix: FixCreator = (iP, issueMsg) =>
    createFix(iP, issueMsg, FIX_MSGS.arrayFlattened);
const createCorrectionFix: FixCreator = (iP, issueMsg) =>
    createFix(iP, issueMsg, FIX_MSGS.corrected);
const createExtractionFix: FixCreator = (iP, issueMsg) =>
    createFix(iP, issueMsg, FIX_MSGS.extracted);
const createMoved2SubTableFix = (iP: string, issueMsg: string, table: string) =>
    createFix(
        iP,
        issueMsg,
        FIX_MSGS.moved2SubTable,
        FIXDETAIL_MSGS.moved2SubTable(table),
    );
const createRenamingFix = (iP: string, issueMsg: string, toProperty: string) =>
    createFix(
        iP,
        issueMsg,
        FIX_MSGS.renamed,
        FIXDETAIL_MSGS.renamed(toProperty),
    );

const KNOWN_UNEVALUATED_PROPS = {
    TRUOUTPUTS: "truOutputs",
    TRUINPUTS: "truInputs",
    LOTORLUTYPE: "lotOrLuType",
    LOTORLUID: "lotOrLuId",
};

const EVALUATED_PROPS = {
    TRUOUTPUT: "truOutput",
    TRUINPUT: "truInput",
    LOTID: "lotId",
    LUID: "luId",
    REGISTRATIONS: "registrations",
};

const PROP_VALUES = {
    LOTTYPE: "Lot",
    LUTYPE: "LU",
};

const SIMPLE_RENAMING_LIST: { path: RegExp; from: string; to: string }[] = [
    {
        path: REGEXPS.ACTIVITY_INSTANCEPATH,
        from: KNOWN_UNEVALUATED_PROPS.TRUOUTPUTS,
        to: EVALUATED_PROPS.TRUOUTPUT,
    },
    {
        path: REGEXPS.ACTIVITY_INSTANCEPATH,
        from: KNOWN_UNEVALUATED_PROPS.TRUINPUTS,
        to: EVALUATED_PROPS.TRUINPUT,
    },
];

const SUBTABLE_MOVES: { path: RegExp; property: RegExp; tableName: string }[] =
    [
        {
            path: REGEXPS.STATION_OR_FBO_INSTANCEPATH,
            property: REGEXPS.REGISTRATION_PROPS,
            tableName: EVALUATED_PROPS.REGISTRATIONS,
        },
    ];

export type FixIssueHandler = (
    data: any,
    issue: ValidationError,
    addIssueFixCb: (issueFix: IssueFix) => void,
) => void;
type FixUnevaluatedPropertyHandler = (
    obj: Record<string, any>,
    property: string,
    issue: ValidationError,
    addIssueCb: (issue: IssueFix) => void,
) => boolean;

function getObjAndProperty(
    data: any,
    path: string,
    pathSuffixIsProperty: boolean = true,
): { obj: any; property: string | undefined } {
    const pathElements = path.slice(1).split("/");
    const propertyName = pathSuffixIsProperty ? pathElements.pop() : undefined;
    const obj = getValueFromPath(data, pathElements);
    return { obj: obj, property: propertyName };
}

// #region unevaluated property handlers
const simpleRenamingHandlers: FixUnevaluatedPropertyHandler[] =
    SIMPLE_RENAMING_LIST.map(
        (simpleRenaming) => (obj, property, issue, addIssueFixCb) => {
            if (
                issue.instancePath.match(simpleRenaming.path) &&
                property === simpleRenaming.from
            ) {
                const value = obj[property];
                delete obj[property];
                if (obj[simpleRenaming.to] === undefined) {
                    obj[simpleRenaming.to] = value;
                    addIssueFixCb(
                        createRenamingFix(
                            issue.instancePath,
                            issue.message!,
                            simpleRenaming.to,
                        ),
                    );
                } else {
                    addIssueFixCb(
                        createDeletionFix(issue.instancePath, issue.message!),
                    );
                }
                return true;
            }
            return false;
        },
    );

const unevaluatedLotOrLuPropertyHandler: FixUnevaluatedPropertyHandler = (
    obj,
    property,
    issue,
    addIssueFixCb,
) => {
    if (
        issue.instancePath.match(REGEXPS.TRU_INSTANCEPATH) &&
        [
            KNOWN_UNEVALUATED_PROPS.LOTORLUID,
            KNOWN_UNEVALUATED_PROPS.LOTORLUTYPE,
        ].includes(property)
    ) {
        const id = obj[KNOWN_UNEVALUATED_PROPS.LOTORLUID];
        const type = obj[KNOWN_UNEVALUATED_PROPS.LOTORLUTYPE];
        if (
            id &&
            [PROP_VALUES.LOTTYPE, PROP_VALUES.LUTYPE].includes(type) &&
            obj[EVALUATED_PROPS.LOTID] === undefined &&
            obj[EVALUATED_PROPS.LUID] === undefined
        ) {
            const newProperty =
                type === PROP_VALUES.LOTTYPE
                    ? EVALUATED_PROPS.LOTID
                    : EVALUATED_PROPS.LUID;
            obj[newProperty] = id;
            delete obj[KNOWN_UNEVALUATED_PROPS.LOTORLUID];
            delete obj[KNOWN_UNEVALUATED_PROPS.LOTORLUTYPE];
            addIssueFixCb(
                createRenamingFix(
                    issue.instancePath,
                    VALIDATION_ERROR_MSGS.mustNotHaveUnevaluatedProperty(
                        KNOWN_UNEVALUATED_PROPS.LOTORLUID,
                    ),
                    newProperty,
                ),
            );
            addIssueFixCb(
                createDeletionFix(
                    issue.instancePath,
                    VALIDATION_ERROR_MSGS.mustNotHaveUnevaluatedProperty(
                        KNOWN_UNEVALUATED_PROPS.LOTORLUTYPE,
                    ),
                ),
            );
            return true;
        }
    }
    return false;
};

const move2SubTableHandlers: FixUnevaluatedPropertyHandler[] =
    SUBTABLE_MOVES.map((move) => (obj, property, issue, addIssueFixCb) => {
        if (
            issue.instancePath.match(move.path) &&
            property.match(move.property)
        ) {
            let table = obj[move.tableName];
            if (table === undefined) {
                table = [{ "": undefined }];
                obj[move.tableName] = table;
            }
            if (
                Array.isArray(table) &&
                table.length === 1 &&
                isObject(table[0]) &&
                Object.keys(table[0]).includes("")
            ) {
                table[0][property] = obj[property];
                delete obj[property];
                addIssueFixCb(
                    createMoved2SubTableFix(
                        issue.instancePath,
                        issue.message!,
                        move.tableName,
                    ),
                );
                return true;
            }
        }
        return false;
    });

const defaultUnevaluatedPropertyHandler: FixUnevaluatedPropertyHandler = (
    obj,
    property,
    issue,
    addIssueFixCb,
) => {
    const schema = issue.parentSchema as any;
    const evaluatableProps = issue.params.evaluatableProps;
    if (
        Array.isArray(evaluatableProps) &&
        !evaluatableProps.includes(property)
    ) {
        delete obj[property];
        addIssueFixCb(createDeletionFix(issue.instancePath, issue.message!));
        return true;
    }
    return false;
};

const unevaluatedPropertyHandlers = [
    ...move2SubTableHandlers,
    ...simpleRenamingHandlers,
    unevaluatedLotOrLuPropertyHandler,
    defaultUnevaluatedPropertyHandler,
];

export const unevaluatedPropertyHandler: FixIssueHandler = (
    data,
    issue,
    addIssueFixCb,
) => {
    const { obj } = getObjAndProperty(data, issue.instancePath, false);
    const property = issue.params.unevaluatedProperty;
    if (!obj || !property || !obj[property]) {
        return;
    }
    unevaluatedPropertyHandlers.some((handler) =>
        handler(obj, property, issue, addIssueFixCb),
    );
};
// #endregion

export const mustBeArrayHandler: FixIssueHandler = (
    data,
    issue,
    addIssueFixCb,
) => {
    const { obj, property } = getObjAndProperty(data, issue.instancePath);
    if (property && typeof obj?.[property] === "string") {
        addIssueFixCb(
            createArrayConversionFix(issue.instancePath, issue.message!),
        );
        obj[property] = [obj[property]];
    }
};

export const mustBeObjectHandler: FixIssueHandler = (
    data,
    issue,
    addIssueFixCb,
) => {
    const { obj, property } = getObjAndProperty(data, issue.instancePath);
    if (!property || obj?.[property] === undefined) {
        return;
    }
    const value = obj[property];
    if (Array.isArray(value)) {
        if (Array.isArray(obj) && obj.length === 1) {
            // array content of inner array should be in outer array
            obj.pop();
            value.forEach((x) => obj.push(x));
            addIssueFixCb(
                createArrayFlatteningFix(issue.instancePath, issue.message!),
            );
        } else if (value.length === 0) {
            // empty array
            delete obj[property];
            addIssueFixCb(
                createDeletionFix(issue.instancePath, issue.message!),
            );
        }
    }
};

export const mustNotHaveAdditionalPropertiesHandler: FixIssueHandler = (
    data,
    issue,
    addIssueFixCb,
) => {
    const { obj } = getObjAndProperty(data, issue.instancePath, false);
    const schema = issue.parentSchema as any;
    if (
        isObject(obj) &&
        isObjectSchema(schema) &&
        schema.additionalProperties === false
    ) {
        const allowedProps = new Set(Object.keys(schema.properties));
        const observedProps = Object.keys(obj);
        const additionalProps = observedProps.filter(
            (prop) => !allowedProps.has(prop),
        );
        if (
            additionalProps.length === 1 &&
            additionalProps[0] === "" &&
            isObject(obj[""])
        ) {
            const innerKeys = Object.keys(obj[""]);
            if (innerKeys.every((key) => obj[key] === undefined)) {
                innerKeys.forEach((key) => (obj[key] = obj[""][key]));
                delete obj[""];
                addIssueFixCb(
                    createExtractionFix(
                        issue.instancePath,
                        VALIDATION_ERROR_MSGS.mustNotHaveAdditionalProperty(""),
                    ),
                );
            }
        } else {
            additionalProps.forEach((prop) => {
                delete obj[prop];
                addIssueFixCb(
                    createDeletionFix(
                        issue.instancePath,
                        VALIDATION_ERROR_MSGS.mustNotHaveAdditionalProperty(
                            prop,
                        ),
                    ),
                );
            });
        }
    }
};

export const mustBeOfTypeHandler: FixIssueHandler = (
    data,
    issue,
    addIssueFixCb,
) => {
    const { obj, property } = getObjAndProperty(data, issue.instancePath);
    if (property && obj?.[property] !== undefined) {
        const value = obj[property];
        const type = issue.message?.match(
            VALIDATION_ERROR_MSGS.mustBeOfTypeRegex,
        )?.[1];
        const converter = type ? ValueType2FixFunction[type] : undefined;
        if (converter) {
            const newValue = converter(value);
            if (newValue !== undefined && newValue !== value) {
                addIssueFixCb(
                    createCorrectionFix(issue.instancePath, issue.message!),
                );
                obj[property] = newValue;
            }
        }
    }
};
