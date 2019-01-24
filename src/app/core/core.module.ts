import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HttpClientModule } from '@angular/common/http';

import { MaterialModule } from '../shared/material.module';

import { SpinnerLoaderComponent } from './spinner-loader/spinner-loader.component';
import { MainDashComponent } from './main-dash/main-dash.component';
import { AlertComponent } from './alert/alert.component';

const coreModules = [
    HttpClientModule
];

const coreComponents = [
    SpinnerLoaderComponent,
    MainDashComponent,
    AlertComponent
];

@NgModule({
    imports: [
        CommonModule,
        MaterialModule,
        RouterModule.forChild([]),
        FlexLayoutModule,
        ...coreModules
    ],
    exports: [
        ...coreComponents,
        ...coreModules
    ],
    declarations: [
        ...coreComponents
    ]
})
export class CoreModule {}
