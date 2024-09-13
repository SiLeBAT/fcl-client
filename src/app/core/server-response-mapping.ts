import { HttpErrorResponse } from "@angular/common/http";
import { HTML_ERROR_CODE_UNPROCESSABLE_ENTITY } from "./html-error-codes.constants";
import { ValidationError } from "./model";
import { SERVER_ERROR_CODE } from "./server-response.enums";
import { InvalidDataErrorDTO } from "./server-response.model";

export function isErrorWithInvalidDataErrorDTO(error: unknown): boolean {
    return (
        error instanceof HttpErrorResponse &&
        error.status === HTML_ERROR_CODE_UNPROCESSABLE_ENTITY &&
        error.error instanceof Object &&
        error.error.code === SERVER_ERROR_CODE.INVALID_INPUT &&
        error.error.errors instanceof Array &&
        error.error.errors.every(
            (valdationError: ValidationError) =>
                valdationError instanceof Object &&
                typeof valdationError.code === "string" &&
                valdationError.code !== "" &&
                typeof valdationError.message === "string" &&
                valdationError.message !== "",
        )
    );
}

export function fromErrorExtractInvalidDataErrorDTO(
    error: unknown,
): InvalidDataErrorDTO {
    if (isErrorWithInvalidDataErrorDTO(error)) {
        return (error as HttpErrorResponse).error as InvalidDataErrorDTO;
    }
    throw new Error("The InvalidDataErrorDTO is not valid.");
}
