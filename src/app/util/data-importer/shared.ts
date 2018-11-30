import * as Ajv from 'ajv';

export async function isValidJson(schema: any, data: any): Promise<boolean> {
    const ajv = new Ajv();
    // const validate = ajv.compile(schema);
    // validate()
    const valid = ajv.validate(schema, data);
    if (!valid) {
        console.log(ajv.errors);
    }
    return valid;
    // const validate = ajv.compile(schema);
}
