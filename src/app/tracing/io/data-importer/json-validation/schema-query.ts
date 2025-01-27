import {
    getValueFromPath,
    removeUndefined,
} from "../../../../tracing/util/non-ui-utils";
import { SchemaObject } from "ajv";

interface RefSchemaObject {
    $ref: string;
}

interface AllOfSchemaObject {
    allOf: SchemaObject[];
}

interface OneOfSchemaObject {
    oneOf: SchemaObject[];
}

interface AnyOfSchemaObject {
    anyOf: SchemaObject[];
}

interface ArraySchemaObject {
    items: SchemaObject;
}

interface ObjectSchemaObject {
    properties: { [key: string]: SchemaObject };
    additionalProperties?: boolean;
}

interface IfThenSchemaObject {
    then: SchemaObject;
}

interface IfThenElseSchemaObject extends IfThenSchemaObject {
    else: SchemaObject;
}

function isRefSchema(
    schema: SchemaObject | RefSchemaObject,
): schema is RefSchemaObject {
    return typeof schema.$ref === "string";
}

function isAllOfSchema(
    schema: SchemaObject | AllOfSchemaObject,
): schema is AllOfSchemaObject {
    return Array.isArray(schema.allOf);
}

function isOneOfSchema(
    schema: SchemaObject | OneOfSchemaObject,
): schema is OneOfSchemaObject {
    return Array.isArray(schema.oneOf);
}

function isAnyOfSchema(
    schema: SchemaObject | AnyOfSchemaObject,
): schema is AnyOfSchemaObject {
    return Array.isArray(schema.anyOf);
}

function isIfThenSchema(
    schema: SchemaObject | IfThenSchemaObject,
): schema is IfThenSchemaObject {
    return typeof schema.then === "object" && schema.then !== null;
}

function isIfThenElseSchema(
    schema: SchemaObject | IfThenElseSchemaObject,
): schema is IfThenElseSchemaObject {
    return (
        isIfThenSchema(schema) &&
        typeof schema.else === "object" &&
        schema.else !== null
    );
}

function isArraySchema(
    schema: SchemaObject | ArraySchemaObject,
): schema is ArraySchemaObject {
    return typeof schema.items === "object" && schema.items !== null;
}

export function isObjectSchema(
    schema: SchemaObject | ObjectSchemaObject,
): schema is ObjectSchemaObject {
    return typeof schema.properties === "object" && schema.properties !== null;
}

function resolveSchemas(
    schemas: SchemaObject[],
    completeSchema: SchemaObject,
    resolveRefSchemas: boolean = true,
): SchemaObject[] {
    const resolvedSchemas = new Set<SchemaObject>();
    const traversedSchemas = new Set<SchemaObject>();
    const schemaStack = Array.from(new Set(schemas));

    while (schemaStack.length > 0) {
        const schema = schemaStack.pop()!;
        if (traversedSchemas.has(schema) || resolvedSchemas.has(schema)) {
            continue;
        }
        traversedSchemas.add(schema);
        if (resolveRefSchemas && isRefSchema(schema)) {
            schemaStack.push(resolveRef(schema, completeSchema));
        } else if (isAllOfSchema(schema)) {
            schemaStack.push(...schema.allOf);
        } else if (isOneOfSchema(schema)) {
            schemaStack.push(...schema.oneOf);
        } else if (isAnyOfSchema(schema)) {
            schemaStack.push(...schema.anyOf);
        } else if (isIfThenElseSchema(schema)) {
            schemaStack.push(schema.then, schema.else);
        } else if (isIfThenSchema(schema)) {
            schemaStack.push(schema.then);
        } else {
            resolvedSchemas.add(schema);
        }
    }

    return Array.from(resolvedSchemas);
}

function resolveRef(
    refSchema: RefSchemaObject,
    completeSchema: SchemaObject,
): SchemaObject {
    const subSchema = getValueFromPath(
        completeSchema,
        refSchema.$ref.slice(2).split("/"),
    );
    if (isRefSchema(subSchema)) {
        return resolveRef(subSchema, completeSchema);
    }
    return subSchema;
}

function isArrayIndex(property: string): boolean {
    return /^\d+/.test(property);
}

function getSchemaObjectsForPropertyPath(
    propertyPath: string[],
    schemas: SchemaObject[],
    completeSchema: SchemaObject,
): SchemaObject[] {
    if (propertyPath.length === 0 || schemas.length === 0) {
        return schemas;
    }
    const resolvedSchemas = resolveSchemas(schemas, completeSchema);
    const property = propertyPath[0];
    if (isArrayIndex(property)) {
        const itemSchemas = resolvedSchemas
            .filter(isArraySchema)
            .map((s) => s.items);
        return getSchemaObjectsForPropertyPath(
            propertyPath.slice(1),
            itemSchemas,
            completeSchema,
        );
    }
    const propSchemas = removeUndefined(
        resolvedSchemas
            .filter(isObjectSchema)
            .map((s) => s.properties[property]),
    );
    return getSchemaObjectsForPropertyPath(
        propertyPath.slice(1),
        propSchemas,
        completeSchema,
    );
}

function getPathElements(path: string): string[] {
    return path.slice(1).split("/");
}

export function getSchemaRefForInstancePath(
    path: string,
    schema: SchemaObject,
): string | undefined {
    const propertyPath = getPathElements(path);
    const schemasForPath = getSchemaObjectsForPropertyPath(
        propertyPath,
        [schema],
        schema,
    );
    const resolvedSchemasForPath = resolveSchemas(
        schemasForPath,
        schema,
        false,
    );
    const refSchemasForPath = resolvedSchemasForPath.filter(isRefSchema);
    const schemaRefsForPath = Array.from(
        new Set(refSchemasForPath.map((s) => s.$ref)),
    );
    if (schemaRefsForPath.length === 1) {
        return schemaRefsForPath[0];
    }
    return undefined;
}

function getPropSchemasForInstancePath(
    path: string,
    schema: SchemaObject,
): ObjectSchemaObject[] {
    const propertyPath = getPathElements(path);
    const schemasForPath = getSchemaObjectsForPropertyPath(
        propertyPath,
        [schema],
        schema,
    );
    const resolvedSchemasForPath = resolveSchemas(schemasForPath, schema, true);
    const objSchemasForPath = resolvedSchemasForPath.filter(isObjectSchema);
    return objSchemasForPath;
}

export function getEvaluatablePropertiesFromInstancePath(
    instancePath: string,
    schema: SchemaObject,
): string[] {
    const objSchemas = getPropSchemasForInstancePath(instancePath, schema);
    const evaluatableProps = Array.from(
        new Set(objSchemas.map((s) => Object.keys(s.properties)).flat()),
    );
    return evaluatableProps;
}
