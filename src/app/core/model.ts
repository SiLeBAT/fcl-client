export enum SERVER_ERROR_CODE {
    INVALID_INPUT = 5
}

export interface ServerInputValidationError {
    code: string;
    message: string;
}

export type ServerInputValidationErrorDTO = Readonly<ServerInputValidationError>;
