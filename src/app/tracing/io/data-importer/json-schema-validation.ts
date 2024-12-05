import { isNullish } from "../../util/non-ui-utils";
import Ajv2019 from "ajv/dist/2019";
import Ajv from "ajv";
import { InputFormatError } from "../io-errors";
import addFormats from "ajv-formats";

const MAX_NUMBER_OFF_ISSUES_IN_TEXT = 8;
const SCHEMA_VALIDATION_ERROR_PREFIX = `Invalid json schema:`;

export interface ValidationError {
    instancePath: string;
    message: string;
    params: any;
}

export async function isValidJsonSchemaV7(
    schema: any,
    data: any,
    throwError?: boolean,
): Promise<boolean> {
    const ajv = new Ajv({ allErrors: true, strict: false });
    const valid = ajv.validate(schema, data);
    if (!valid && throwError) {
        throwSchemaValidationError(ajv);
    }
    return valid;
}

export async function validateJsonSchemaV2019<
    T extends boolean,
    R extends {
        isValid: T extends true ? true : boolean;
        errors?: ValidationError[];
    },
>(schema: any, data: any, throwError?: T): Promise<R> {
    const ajv = new Ajv2019({ allErrors: true, strictSchema: true });
    addFormats(ajv);

    const valid = ajv.validate(schema, data);
    if (!valid && throwError) {
        throwSchemaValidationError(ajv);
    }
    return {
        isValid: valid,
        errors: (ajv.errors as ValidationError[]) ?? undefined,
    } as R;
}

function throwSchemaValidationError(ajv: Ajv): void {
    throw new InputFormatError(
        `${SCHEMA_VALIDATION_ERROR_PREFIX} ${errorsToText(ajv)}`,
    );
}

function errorsToText(ajv: Ajv): undefined | string {
    if (isNullish(ajv.errors)) {
        return undefined;
    }
    const cutoff = MAX_NUMBER_OFF_ISSUES_IN_TEXT;
    const errors = ajv.errors.slice(0, cutoff);

    let text = ajv.errorsText(errors);
    if (ajv.errors.length > errors.length) {
        text += ` ... (${ajv.errors.length - errors.length} more issue(s))`;
    }
    return text;
}
