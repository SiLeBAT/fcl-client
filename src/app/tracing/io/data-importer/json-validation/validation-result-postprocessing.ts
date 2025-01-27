import { at } from "../../../../tracing/util/non-ui-utils";
import Ajv, { SchemaObject } from "ajv";
import { AJV_VALIDATION_ERROR_MSGS, VALIDATION_ERROR_MSGS } from "./consts";
import { ValidationError } from "./model";
import {
    getEvaluatablePropertiesFromInstancePath,
    getSchemaRefForInstancePath,
} from "./schema-query";

function normalizeInstancePath(path: string): string {
    const isIntegerRegEx = /^\d+$/;
    return path
        .split("/")
        .map((x) => (x.match(isIntegerRegEx) ? "0" : x))
        .join("/");
}

export function postprocessErrors(
    ajv: Ajv,
    schema: SchemaObject,
): ValidationError[] {
    const normalizedInstancePath2EvaluatableProps = new Map<string, string[]>();
    const normalizedInstancePath2RefPath = new Map<
        string,
        string | undefined
    >();
    return (ajv.errors ?? []).map((error) => {
        const processedError: ValidationError = { ...error };
        if (
            error.message === AJV_VALIDATION_ERROR_MSGS.unevaluatedProperties &&
            error.params?.unevaluatedProperty
        ) {
            // replace `..unevaluated properties` with a `..unevaluated property "..."` message
            // adds evaluatableProps to params object
            processedError.message =
                VALIDATION_ERROR_MSGS.mustNotHaveUnevaluatedProperty(
                    error.params?.unevaluatedProperty,
                );
            const normalizedIP = normalizeInstancePath(
                processedError.instancePath,
            );
            let evaluatableProps =
                normalizedInstancePath2EvaluatableProps.get(normalizedIP);
            if (!evaluatableProps) {
                evaluatableProps = getEvaluatablePropertiesFromInstancePath(
                    processedError.instancePath,
                    schema,
                );
                normalizedInstancePath2EvaluatableProps.set(
                    normalizedIP,
                    evaluatableProps,
                );
            }
            processedError.params = { ...(error.params ?? {}) };
            processedError.params.evaluatableProps = evaluatableProps;
        } else if (
            error.message?.match(
                AJV_VALIDATION_ERROR_MSGS.mustMatchPatternRegex,
            )
        ) {
            // replaces message `must match pattern ...` with `must be of type ".."`
            // (the pattern represents a string in certain format, the type is the name for it)
            const normalizedIP = normalizeInstancePath(
                processedError.instancePath,
            );
            let refPath: string | undefined;
            if (normalizedInstancePath2RefPath.has(normalizedIP)) {
                refPath = normalizedInstancePath2RefPath.get(normalizedIP);
            } else {
                refPath = getSchemaRefForInstancePath(
                    processedError.instancePath,
                    schema,
                );
                normalizedInstancePath2RefPath.set(normalizedIP, refPath);
            }
            const type = refPath
                ? at(refPath.split("/"), -1)
                : at(error.schemaPath.split("/"), -2);
            if (type) {
                processedError.message =
                    VALIDATION_ERROR_MSGS.mustBeOfType(type);
            }
        }
        return processedError;
    });
}
