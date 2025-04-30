export const FIX_MSGS = {
    renamed: "renamed",
    deleted: "deleted",
    corrected: "corrected",
    converted2Array: "converted to array",
    arrayFlattened: "array was unwrapped",
    moved2SubTable: "moved to sub table",
    extracted: `replaced { "": { ... } } by { ... }`,
} as const;

export const FIXDETAIL_MSGS = {
    renamed: (to: string) => `renamed to "${to}"`,
    moved2SubTable: (table: string) => `property was moved to ${table}/0/`,
};
