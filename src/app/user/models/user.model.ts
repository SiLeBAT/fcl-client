export interface User {
    email: string;
    firstName?: string;
    lastName?: string;
    _id: any;
}
export interface TokenizedUser extends User {
    token: string;
}

export interface Email {
    email: string;
}

export interface NewPassword {
    newPw: string;
}
export interface Credentials extends Email {
    password: string;
}

export class NewUser implements Credentials {
    constructor(
      public email: string,
      public password: string,
      public firstName: string,
      public lastName: string
    ) { }
}

export class DefaultUser implements User {
    _id: any;

    constructor(
      public email: string,
      public firstName: string = '',
      public lastName: string = ''
  ) { }
}

export interface LoginResponseDTO {
    user: TokenizedUser;
    title: string;
}

export interface TitleResponseDTO {
    title: string;
}

// export interface ActivationResponseDTO {
//     activation: boolean;
// }

export interface AdminActivateResponseDTO extends TitleResponseDTO {
    name: string;
}
