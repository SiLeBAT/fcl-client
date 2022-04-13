import { ServerInputValidationError } from './model';

export class InvalidServerInputHttpErrorResponse {
    constructor(public message: string, public errors: ServerInputValidationError[]) {}
}
