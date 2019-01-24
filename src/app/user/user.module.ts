import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { PasswordStrengthMeterModule } from 'angular-password-strength-meter';

import { SharedModule } from './../shared/shared.module';
import { MaterialModule } from './../shared/material.module';
import { UserRoutingModule } from './user.routing.module';
import { ActivateComponent } from './activate/activate.component';
import { AdminActivateComponent } from './admin-activate/admin-activate.component';
import { AlertComponent } from './alert/alert.component';
import { TokenInterceptor } from './interceptors/token.interceptor';
import { JwtInterceptor } from './interceptors/jwt.interceptor';
import { LoginComponent } from './login/login.component';
import { RecoveryComponent } from './recovery/recovery.component';
import { RegisterComponent } from './register/register.component';
import { ResetComponent } from './reset/reset.component';
import { HomeComponent } from './home/home.component';

const userModules = [
    FormsModule,
    FlexLayoutModule
];

const userComponents = [
    AlertComponent
];

@NgModule({
    imports: [
        CommonModule,
        HttpClientModule,
        ReactiveFormsModule,
        PasswordStrengthMeterModule,
        SharedModule,
        MaterialModule,
        UserRoutingModule,
        ...userModules
    ],
    exports: [
        ...userModules,
        ...userComponents
    ],
    declarations: [
        ActivateComponent,
        AdminActivateComponent,
        LoginComponent,
        RecoveryComponent,
        RegisterComponent,
        ResetComponent,
        HomeComponent,
        ...userComponents
    ],
    providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: TokenInterceptor,
            multi: true
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: JwtInterceptor,
            multi: true
        }
    ]
})
export class UserModule { }
