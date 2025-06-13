import { ModelInputType } from "./model";

export const DIALOG_TITLES = {
    dataImportErrors: "Data import errors",
} as const;

export const ERROR_TEXTS = {
    dataUploadFailed: `Data cannot be loaded.`,
    invalidDataFormat: `Invalid data format.`,
    generalError: `Error:`,
} as const;

export const ERROR_RESOLUTION_TEXTS = {
    uploadUTF8: `Please ensure to load only data encoded in UTF-8 format.`,
    uploadFclJsonWithValidFormat: `Please select a FCL file with the correct format!`,
    uploadFclJsonWithValidData: `Please select a FCL file with valid data!`,
    uploadUtxWithValidFormat: `Please select an UTX file with the correct format!`,
    uploadUtxWithValidData: `Please select an UTX file with the valid data!`,
    uploadAllInOneTemplate: `Please select an .xlsx file with the correct format (FCL All-in-one template)!`,
    uploadFileWithValidFormat: `Please select a file with the correct format!`,
    uploadFileWithValidData: `Please select a file with the valid data!`,
    //
    uploadFileWithValidFormatOfType: (type: ModelInputType | undefined) =>
        type === "json-fcl"
            ? ERROR_RESOLUTION_TEXTS.uploadFclJsonWithValidFormat
            : type === "json-utx"
              ? ERROR_RESOLUTION_TEXTS.uploadUtxWithValidFormat
              : type === "xlsx-all-in-one"
                ? ERROR_RESOLUTION_TEXTS.uploadAllInOneTemplate
                : ERROR_RESOLUTION_TEXTS.uploadFileWithValidFormat,
    uploadFileWithValidDataOfType: (type: ModelInputType | undefined) =>
        type === "json-fcl"
            ? ERROR_RESOLUTION_TEXTS.uploadFclJsonWithValidData
            : type === "json-utx"
              ? ERROR_RESOLUTION_TEXTS.uploadUtxWithValidData
              : type === "xlsx-all-in-one"
                ? ERROR_RESOLUTION_TEXTS.uploadAllInOneTemplate
                : ERROR_RESOLUTION_TEXTS.uploadFileWithValidData,
} as const;
