import { UserValidationErrorCode } from "../../core/server-response.enums";
import { RegistrationDetailsDTO } from "../models/user.model";

export const CODE_TO_FIELD_MAP: Readonly<
    Record<UserValidationErrorCode, keyof RegistrationDetailsDTO>
> = {
    [UserValidationErrorCode.MISSING_PWD]: "password",
    [UserValidationErrorCode.INVALID_PWD]: "password",
    [UserValidationErrorCode.MISSING_FIRSTNAME]: "firstName",
    [UserValidationErrorCode.INVALID_FIRSTNAME]: "firstName",
    [UserValidationErrorCode.MISSING_LASTNAME]: "lastName",
    [UserValidationErrorCode.INVALID_LASTNAME]: "lastName",
    [UserValidationErrorCode.MISSING_EMAIL]: "email",
    [UserValidationErrorCode.INVALID_EMAIL]: "email",
    [UserValidationErrorCode.INVALID_GDPRA]: "dataProtectionAgreed",
};
