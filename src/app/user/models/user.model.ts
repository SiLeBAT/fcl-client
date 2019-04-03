export interface User {
    email: string;
    firstName?: string;
    lastName?: string;
    _id: any;
}
export interface TokenizedUser extends User {
    token: string;
}

export interface NewPassword {
    newPw: string;
}
export interface Email {
    email: string
}
export interface LoginCredentials extends Email {
    password: string;
}

export interface RegistrationCredentials extends LoginCredentials {
    firstName: string;
    lastName: string;
}

export interface TitleResponseDTO {
    title: string;
}

export interface LoginResponseDTO extends TitleResponseDTO {
    user: TokenizedUser;
}

export interface AdminActivateResponseDTO extends TitleResponseDTO {
    name: string;
}
