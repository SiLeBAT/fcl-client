import * as Ajv from 'ajv';

export async function isValidJson(schema: any, data: any): Promise<boolean> {
    const ajv = new Ajv();
    const valid = ajv.validate(schema, data);
    return valid;
}
