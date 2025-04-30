import { isObject } from "../../../../tracing/util/non-ui-utils";
import { SchemaObject } from "ajv";
import { isAllOfSchema } from "../json-validation/schema-query";

const IGNORED_TYPES = ["Uuid"];

const STRING_SPECIFIC_KEYS = ["minLength", "maxLength", "format", "pattern"];
const NUMBER_SPECIFIC_KEYS = ["minimum", "exclusiveMinimum"];

interface SchemaWithTypes {
    $defs: { types: Record<string, SchemaObject> };
}

function deleteKeys(value: any, keys: string[]): any {
    if (isObject(value)) {
        const newValue = { ...value };
        keys.forEach((key) => delete newValue[key]);
        return newValue;
    }
    return value;
}

function relaxDefinition(definition: any): any {
    if (definition?.type === "number") {
        if (
            Object.keys(definition).some((key) =>
                NUMBER_SPECIFIC_KEYS.includes(key),
            )
        ) {
            return deleteKeys(definition, NUMBER_SPECIFIC_KEYS);
        }
    } else if (definition?.type === "string") {
        if (
            Object.keys(definition).some((key) =>
                STRING_SPECIFIC_KEYS.includes(key),
            )
        ) {
            return deleteKeys(definition, STRING_SPECIFIC_KEYS);
        }
    } else if (isAllOfSchema(definition)) {
        return {
            ...definition,
            allOf: definition.allOf.map((d) => relaxDefinition(d)),
        };
    }
    return definition;
}

function isSchemaWithTypes(
    schema: SchemaObject | SchemaWithTypes,
): schema is SchemaWithTypes {
    return isObject(schema?.$defs?.types);
}

export function relaxSchema(schema: SchemaObject): SchemaObject {
    if (isSchemaWithTypes(schema)) {
        let typeNames = Object.keys(schema.$defs.types);
        typeNames = typeNames.filter((x) => !IGNORED_TYPES.includes(x));
        if (typeNames.length > 0) {
            const newTypes = { ...schema.$defs.types };

            typeNames.forEach(
                (x) => (newTypes[x] = relaxDefinition(newTypes[x])),
            );
            return { ...schema, $defs: { ...schema.$defs, types: newTypes } };
        }
    }
    return schema;
}
