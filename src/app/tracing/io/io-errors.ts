export class InternalError extends Error {
    // eslint-disable-next-line
    constructor(...args: any[]) {
        // Calling parent constructor of base Error class.
        super(...args);
        Object.setPrototypeOf(this, InternalError.prototype);
        // Saving class name in the property of our custom error as a shortcut.
        this.name = this.constructor.name;

        // Capturing stack trace, excluding constructor call from it.
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export class InputEncodingError extends Error {
    // eslint-disable-next-line
    constructor(...args: any[]) {
        // Calling parent constructor of base Error class.
        super(...args);
        Object.setPrototypeOf(this, InputEncodingError.prototype);
        // Saving class name in the property of our custom error as a shortcut.
        this.name = this.constructor.name;

        // Capturing stack trace, excluding constructor call from it.
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export class InputFormatError extends Error {
    // eslint-disable-next-line
    constructor(...args: any[]) {
        // Calling parent constructor of base Error class.
        super(...args);
        Object.setPrototypeOf(this, InputFormatError.prototype);
        // Saving class name in the property of our custom error as a shortcut.
        this.name = this.constructor.name;

        // Capturing stack trace, excluding constructor call from it.
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export class XlsxInputFormatError extends InputFormatError {
    // eslint-disable-next-line
    constructor(...args: any[]) {
        // Calling parent constructor of base Error class.
        super(...args);
        Object.setPrototypeOf(this, XlsxInputFormatError.prototype);
        // Saving class name in the property of our custom error as a shortcut.
        this.name = this.constructor.name;

        // Capturing stack trace, excluding constructor call from it.
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export class AllInOneXlsxInputFormatError extends XlsxInputFormatError {
    // eslint-disable-next-line
    constructor(...args: any[]) {
        // Calling parent constructor of base Error class.
        super(...args);
        Object.setPrototypeOf(this, AllInOneXlsxInputFormatError.prototype);
        // Saving class name in the property of our custom error as a shortcut.
        this.name = this.constructor.name;

        // Capturing stack trace, excluding constructor call from it.
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export class FclJsonInputFormatError extends InputFormatError {
    // eslint-disable-next-line
    constructor(...args: any[]) {
        // Calling parent constructor of base Error class.
        super(...args);
        Object.setPrototypeOf(this, FclJsonInputFormatError.prototype);
        // Saving class name in the property of our custom error as a shortcut.
        this.name = this.constructor.name;

        // Capturing stack trace, excluding constructor call from it.
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export class InputDataError extends Error {
    // eslint-disable-next-line
    constructor(...args: any[]) {
        // Calling parent constructor of base Error class.
        super(...args);
        Object.setPrototypeOf(this, InputDataError.prototype);
        // Saving class name in the property of our custom error as a shortcut.
        this.name = this.constructor.name;

        // Capturing stack trace, excluding constructor call from it.
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
