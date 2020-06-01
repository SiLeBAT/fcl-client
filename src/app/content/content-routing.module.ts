import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DataProtectionDeclarationComponent } from './data-protection-declaration/data-protection-declaration.component';
import { DataProtectionNoticeComponent } from './data-protection-notice/data-protection-notice.component';

const contentRoutes: Routes = [
    {
        path: 'content/dataprotectiondeclaration',
        component: DataProtectionDeclarationComponent
    },
    {
        path: 'content/dataprotectionnotice',
        component: DataProtectionNoticeComponent
    }
];

@NgModule({
    imports: [
        RouterModule.forChild(contentRoutes)
    ],
    exports: [
        RouterModule
    ]
})

export class ContentRoutingModule { }
