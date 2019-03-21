import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule } from './material.module';
import { SpinnerLoaderComponent } from './spinner-loader/spinner-loader.component';
import { AlertComponent } from './alert/alert.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
    imports: [
        CommonModule,
        MaterialModule
    ],
    declarations: [
        SpinnerLoaderComponent,
        AlertComponent
    ],
    exports: [
        FormsModule,
        ReactiveFormsModule,
        MaterialModule,
        SpinnerLoaderComponent,
        AlertComponent
    ]
})
export class SharedModule { }
