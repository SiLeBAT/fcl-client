import { RegistrationDetailsDTO } from '../models/user.model';

export enum UserValidationErrorCode {
    INVALID_PWD = 'INVALID_PWD',
    INVALID_FIRSTNAME = 'INVALID_FIRSTNAME',
    INVALID_LASTNAME = 'INVALID_LASTNAME',
    INVALID_EMAIL = 'INVALID_EMAIL',
    INVALID_GDPRA = 'INVALID_GDPR',
    MISSING_PWD = 'MISSING_PWD',
    MISSING_FIRSTNAME = 'MISSING_FIRSTNAME',
    MISSING_LASTNAME = 'MISSING_LASTNAME',
    MISSING_EMAIL = 'MISSING_EMAIL'
}

export const CODE_TO_FIELD_Map: Readonly<Record<UserValidationErrorCode, keyof RegistrationDetailsDTO>> = {
    [UserValidationErrorCode.MISSING_PWD]: 'password',
    [UserValidationErrorCode.INVALID_PWD]: 'password',
    [UserValidationErrorCode.MISSING_FIRSTNAME]: 'firstName',
    [UserValidationErrorCode.INVALID_FIRSTNAME]: 'firstName',
    [UserValidationErrorCode.MISSING_LASTNAME]: 'lastName',
    [UserValidationErrorCode.INVALID_LASTNAME]: 'lastName',
    [UserValidationErrorCode.MISSING_EMAIL]: 'email',
    [UserValidationErrorCode.INVALID_EMAIL]: 'email',
    [UserValidationErrorCode.INVALID_GDPRA]: 'dataProtectionAgreed'
};
