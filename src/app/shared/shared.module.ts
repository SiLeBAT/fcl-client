import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { MaterialModule } from './material.module';
import { SpinnerLoaderComponent } from './spinner-loader/spinner-loader.component';
import { AlertComponent } from './alert/alert.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SingleCenterCardLayoutComponent } from './presentation/single-center-card-layout/single-center-card-layout.component';
import { DisableSubscriptWrapperTabFocusDirective } from './directives/disable-subscript-wrapper-tab-focus';

@NgModule({
    imports: [
        CommonModule,
        MaterialModule,
        DragDropModule
    ],
    declarations: [
        SpinnerLoaderComponent,
        AlertComponent,
        SingleCenterCardLayoutComponent,
        DisableSubscriptWrapperTabFocusDirective
    ],
    exports: [
        FormsModule,
        ReactiveFormsModule,
        MaterialModule,
        DragDropModule,
        ScrollingModule,
        SpinnerLoaderComponent,
        AlertComponent,
        SingleCenterCardLayoutComponent,
        DisableSubscriptWrapperTabFocusDirective
    ]
})
export class SharedModule { }
