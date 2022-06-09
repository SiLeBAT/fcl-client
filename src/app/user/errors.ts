import { InvalidServerInputHttpErrorResponse } from '@app/core/errors';
import { ValidationError } from '@app/core/model';
import { CODE_TO_FIELD_MAP } from './consts/error-code-mappings.consts';
import { RegistrationCredentials } from './models/user.model';

export class InvalidRegistrationInput {
    private _errors: Partial<Record<keyof RegistrationCredentials, ValidationError[]>> = {};
    private _message: string | null = null;

    get errors(): Partial<Record<keyof RegistrationCredentials, ValidationError[]>> {
        return this._errors;
    }

    get message(): string | null {
        return this._message;
    }

    constructor(error: InvalidServerInputHttpErrorResponse) {
        this._message = error.message;
        this.mapErrors(error.errors);
    }

    private mapErrors(validationErrors: ValidationError[]): void {
        this._errors = {};
        validationErrors.forEach(error => {
            const field = CODE_TO_FIELD_MAP[error.code] as undefined | keyof RegistrationCredentials;
            if (field !== undefined) {
                const fieldErrors = this._errors[field];
                if (fieldErrors !== undefined) {
                    fieldErrors.push(error);
                } else {
                    this._errors[field] = [error];
                }
            }
        });
    }
}
