export function isValueTypeValid(value: any, reqType: string): boolean {
    const obsType = typeof value;
    return obsType === reqType || value === null || value === undefined;
}
