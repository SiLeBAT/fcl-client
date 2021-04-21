import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { MaterialModule } from './material.module';
import { SpinnerLoaderComponent } from './spinner-loader/spinner-loader.component';
import { AlertComponent } from './alert/alert.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SingleCenterCardLayoutComponent } from './presentation/single-center-card-layout/single-center-card-layout.component';

@NgModule({
    imports: [
        CommonModule,
        MaterialModule,
        DragDropModule
    ],
    declarations: [
        SpinnerLoaderComponent,
        AlertComponent,
        SingleCenterCardLayoutComponent
    ],
    exports: [
        FormsModule,
        ReactiveFormsModule,
        MaterialModule,
        DragDropModule,
        SpinnerLoaderComponent,
        AlertComponent,
        SingleCenterCardLayoutComponent
    ]
})
export class SharedModule { }
