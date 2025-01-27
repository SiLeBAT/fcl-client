import { SchemaObject } from "ajv";
import { InputFormatError } from "../../io-errors";
import {
    error2Text,
    validateJsonSchemaV2019,
} from "../json-validation/json-schema-validation";
import { ValidationError } from "../json-validation/model";
import { ERROR_MSGS } from "./consts";

export async function validateUtxSchema<
    T extends boolean,
    R extends {
        isValid: T extends true ? true : boolean;
        errors?: ValidationError[];
    },
>(schema: SchemaObject, data: any, throwError?: T): Promise<R> {
    const { isValid, errors } = await validateJsonSchemaV2019(
        schema,
        data,
        false,
    );

    if (!isValid && throwError) {
        throw new InputFormatError(
            ERROR_MSGS.dataViolateUtxSchema,
            errors ? errors.map(error2Text) : undefined,
        );
    }
    return { isValid, errors } as R;
}
