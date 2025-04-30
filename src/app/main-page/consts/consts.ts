import { ModelInputType } from "../../tracing/io/model";

export const FILE_INPUT_ELEMENT_SETTINGS: Record<
    ModelInputType,
    { accept: string }
> = {
    "json-fcl": { accept: "application/json,.json" },
    "json-utx": { accept: "application/json,.json" },
    "xlsx-all-in-one": { accept: ".xlsx" },
};
