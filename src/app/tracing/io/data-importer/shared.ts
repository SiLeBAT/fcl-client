import * as Ajv from 'ajv';

export async function isValidJson(schema: any, data: any, throwError?: boolean): Promise<boolean> {
    const ajv = new Ajv();
    const valid = ajv.validate(schema, data);
    if (!valid && throwError) {
        throw new Error('Invalid json format: ' + ajv.errors.toString());
    }
    return valid;
}
