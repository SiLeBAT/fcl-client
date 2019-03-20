import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule } from './material.module';

@NgModule({
    imports: [
        CommonModule,
        MaterialModule
    ],
    declarations: [
    ],
    exports: [
        MaterialModule
    ]
})
export class SharedModule { }
