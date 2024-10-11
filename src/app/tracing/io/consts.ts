export const ERROR_TEXTS = {
    dataUploadFailed: `Data cannot be uploaded.`,
    invalidDataFormat: `Invalid data format.`,
    generalError: `Error:`,
} as const;

export const ERROR_RESOLUTION_TEXTS = {
    uploadUTF8: `Please ensure to upload only data encoded in UTF-8 format.`,
    uploadFclJsonWithValidFormat: `Please select a .json file with the correct format!`,
    uploadFclJsonWithValidData: `Please select a .json file with valid data!`,
    uploadAllInOneTemplate: `Please select an .xlsx file with the correct format (FCL All-in-one template)!`,
} as const;
