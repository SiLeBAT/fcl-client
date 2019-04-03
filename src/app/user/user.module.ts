import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PasswordStrengthMeterModule } from 'angular-password-strength-meter';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { SharedModule } from './../shared/shared.module';
import { CoreModule } from '../core/core.module';
import { UserRoutingModule } from './user.routing.module';

import { STATE_SLICE_NAME, reducer } from './state/user.reducer';
import { UserEffects } from './state/user.effects';
import { LoginContainerComponent } from './container/login-container/login-container.component';
import { LoginComponent } from './presentation/login/login.component';
import { LoginViewComponent } from './presentation/login-view/login-view.component';
import { RegisterContainerComponent } from './container/register-container/register-container.component';
import { RegisterComponent } from './presentation/register/register.component';
import { RegisterViewComponent } from './presentation/register-view/register-view.component';
import { RecoveryContainerComponent } from './container/recovery-container/recovery-container.component';
import { RecoveryComponent } from './presentation/recovery/recovery.component';
import { RecoveryViewComponent } from './presentation/recovery-view/recovery-view.component';
import { ResetContainerComponent } from './container/reset-container/reset-container.component';
import { ResetComponent } from './presentation/reset/reset.component';
import { ResetViewComponent } from './presentation/reset-view/reset-view.component';
import { ActivateContainerComponent } from './container/activate-container/activate-container.component';
import { ActivateComponent } from './presentation/activate/activate.component';
import { ActivateViewComponent } from './presentation/activate-view/activate-view.component';
import { AdminActivateContainerComponent } from './container/admin-activate-container/admin-activate-container.component';
import { AdminActivateComponent } from './presentation/admin-activate/admin-activate.component';
import { AdminActivateViewComponent } from './presentation/admin-activate-view/admin-activate-view.component';
import { ProfileContainerComponent } from './container/profile-container/profile-container.component';
import { ProfileComponent } from './presentation/profile/profile.component';

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
        FormsModule
    ],
    exports: [],
    declarations: [
        LoginContainerComponent,
        LoginComponent,
        LoginViewComponent,
        RegisterContainerComponent,
        RegisterComponent,
        RegisterViewComponent,
        RecoveryViewComponent,
        RecoveryComponent,
        RecoveryContainerComponent,
        ResetContainerComponent,
        ResetComponent,
        ResetViewComponent,
        ActivateContainerComponent,
        ActivateComponent,
        ActivateViewComponent,
        AdminActivateContainerComponent,
        AdminActivateComponent,
        AdminActivateViewComponent,
        ProfileContainerComponent,
        ProfileComponent
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UserModule { }
