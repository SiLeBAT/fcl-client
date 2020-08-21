export interface User {
    email: string;
    firstName?: string;
    lastName?: string;
    gdprAgreementRequested: boolean;
}
export interface TokenizedUser extends User {
    token: string;
}

export interface GdprConfirmationRequestDTO {
    email: string;
    token: string;
    gdprConfirmed: boolean;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegistrationCredentials extends LoginCredentials {
    firstName: string;
    lastName: string;
    dataProtectionAgreed: boolean;
    newsRegAgreed: boolean;
    newsMailAgreed: boolean;
}

export interface ResetRequestDTO {
    readonly email: string;
}

export interface NewPasswordRequestDTO {
    readonly password: string;
}

export interface RegistrationDetailsDTO {
    readonly email: string;
    readonly password: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly instituteId: string;
    readonly dataProtectionAgreed: boolean;
    readonly newsRegAgreed: boolean;
    readonly newsMailAgreed: boolean;
}

export interface RegistrationRequestResponseDTO {
    readonly registerRequest: boolean;
    readonly email: string;
}

export interface PasswordResetRequestResponseDTO {
    readonly passwordResetRequest: boolean;
    readonly email: string;
}

export interface PasswordResetResponseDTO {
    readonly passwordReset: boolean;
}

export interface ActivationResponseDTO {
    readonly activation: boolean;
    readonly username: string;
}

export interface NewsConfirmationResponseDTO {
    readonly newsconfirmation: boolean;
    readonly username: string;
}

export interface TokenizedUserDTO {
    readonly email: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly instituteId: string;
    readonly token: string;
    readonly gdprAgreementRequested: boolean;
}
