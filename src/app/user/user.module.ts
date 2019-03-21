import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { PasswordStrengthMeterModule } from 'angular-password-strength-meter';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { SharedModule } from './../shared/shared.module';
import { CoreModule } from '../core/core.module';
import { UserRoutingModule } from './user.routing.module';
import { ActivateComponent } from './activate/activate.component';
import { AdminActivateComponent } from './admin-activate/admin-activate.component';
import { LoginComponent } from './login/login.component';
import { RecoveryComponent } from './recovery/recovery.component';
import { RegisterComponent } from './register/register.component';
import { ResetComponent } from './reset/reset.component';
import { HomeComponent } from './home/home.component';

import { STATE_SLICE_NAME, reducer } from './state/user.reducer';
import { UserEffects } from './state/user.effects';

const userModules = [
    FormsModule,
    FlexLayoutModule
];

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        PasswordStrengthMeterModule,
        SharedModule,
        CoreModule,
        UserRoutingModule,
        StoreModule.forFeature(STATE_SLICE_NAME, reducer),
        EffectsModule.forFeature([UserEffects]),
        ...userModules
    ],
    exports: [
        ...userModules
    ],
    declarations: [
        ActivateComponent,
        AdminActivateComponent,
        LoginComponent,
        RecoveryComponent,
        RegisterComponent,
        ResetComponent,
        HomeComponent
    ]
})
export class UserModule { }
