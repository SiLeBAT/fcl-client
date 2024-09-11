import { ValidationError } from "./model";

export class InvalidServerInputHttpErrorResponse {
    constructor(
        public message: string,
        public errors: ValidationError[],
    ) {}
}
