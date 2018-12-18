import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FlexLayoutModule } from '@angular/flex-layout';

import { MaterialModule } from '../shared/material.module';

import { SpinnerLoaderComponent } from './spinner-loader/spinner-loader.component';
import { MainDashComponent } from './main-dash/main-dash.component';

const coreComponents = [
    SpinnerLoaderComponent,
    MainDashComponent
];

@NgModule({
    imports: [
        CommonModule,
        MaterialModule,
        RouterModule.forChild([]),
        FlexLayoutModule
    ],
    exports: [
        ...coreComponents
    ],
    declarations: [
        ...coreComponents
    ]
})
export class CoreModule {}
