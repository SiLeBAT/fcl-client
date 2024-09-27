import { FileInputElementSettings, ModelFileType } from "../model/types";

export const FILE_INPUT_ELEMENT_SETTINGS: Record<
    ModelFileType,
    FileInputElementSettings
> = {
    "json-fcl": { accept: "application/json,.json" },
    "xlsx-all-in-one": { accept: ".xlsx" },
};
