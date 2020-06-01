import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentRoutingModule } from './content-routing.module';
import { DataProtectionDeclarationComponent } from './data-protection-declaration/data-protection-declaration.component';
import { DataProtectionNoticeComponent } from './data-protection-notice/data-protection-notice.component';

@NgModule({
    declarations: [
        DataProtectionDeclarationComponent,
        DataProtectionNoticeComponent
    ],
    imports: [
        CommonModule,
        ContentRoutingModule
    ],
    exports: []
})
export class ContentModule { }
