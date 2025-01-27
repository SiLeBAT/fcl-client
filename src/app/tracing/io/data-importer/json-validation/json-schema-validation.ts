import Ajv2019 from "ajv/dist/2019";
import Ajv, { SchemaObject } from "ajv";
import { InputFormatError } from "../../io-errors";
import addFormats from "ajv-formats";
import { VALIDATION_ERROR_MSGS } from "./consts";
import { postprocessErrors } from "./validation-result-postprocessing";
import { ValidationError } from "./model";

export async function isValidJsonSchemaV7(
    schema: SchemaObject,
    data: any,
    throwError?: boolean,
): Promise<boolean> {
    const ajv = new Ajv({ allErrors: true, strict: false });
    const valid = ajv.validate(schema, data);
    let errors = (ajv.errors as ValidationError[]) ?? undefined;
    if (errors) {
        errors = postprocessErrors(ajv, schema);
    }
    if (!valid && throwError) {
        throwSchemaValidationError(errors);
    }
    return valid;
}

export async function validateJsonSchemaV2019<
    T extends boolean,
    R extends {
        isValid: T extends true ? true : boolean;
        errors?: ValidationError[];
    },
>(schema: SchemaObject, data: any, throwError?: T): Promise<R> {
    const ajv = new Ajv2019({
        allErrors: true,
        strictSchema: true,
        verbose: true,
    });
    addFormats(ajv);

    const valid = ajv.validate(schema, data);
    let errors = (ajv.errors as ValidationError[]) ?? undefined;
    if (errors) {
        errors = postprocessErrors(ajv, schema);
    }

    if (!valid && throwError) {
        throwSchemaValidationError(errors);
    }
    return {
        isValid: valid,
        errors: errors,
    } as R;
}

function throwSchemaValidationError(errors: ValidationError[]): void {
    const errorTxts = errors.map((error) => error2Text(error));
    throw new InputFormatError(
        VALIDATION_ERROR_MSGS.dataViolateSchema,
        errorTxts,
    );
}

export function createErrorText(instancePath: string, message: string): string {
    return `${instancePath} ${message}`;
}

export function error2Text(error: ValidationError): string {
    return createErrorText(error.instancePath, error.message!);
}
