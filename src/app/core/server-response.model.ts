export interface ValidationErrorDTO {
  readonly code: string;
  readonly message: string;
}

interface ErrorDTO {
  readonly code: number;
  readonly message: string;
}

export interface InvalidDataErrorDTO extends ErrorDTO {
  readonly errors: ValidationErrorDTO[];
}
