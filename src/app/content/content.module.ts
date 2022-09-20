import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentRoutingModule } from './content-routing.module';
import { DataProtectionDeclarationComponent } from './data-protection-declaration/data-protection-declaration.component';
import { DataProtectionNoticeComponent } from './data-protection-notice/data-protection-notice.component';
import { StoreModule } from '@ngrx/store';
import { reducer, STATE_SLICE_NAME } from './state/content.reducer';
import { EffectsModule } from '@ngrx/effects';
import { ContentEffects } from './state/content.effects';
import { FundingSourcesViewComponent } from './funding-sources-view/funding-sources-view.component';
import { MaintenanceNotificationViewComponent } from './maintenance-notification-view/maintenance-notification-view.component';

@NgModule({
    declarations: [
        DataProtectionDeclarationComponent,
        DataProtectionNoticeComponent,
        FundingSourcesViewComponent,
        MaintenanceNotificationViewComponent
    ],
    imports: [
        CommonModule,
        ContentRoutingModule,
        StoreModule.forFeature(STATE_SLICE_NAME, reducer),
        EffectsModule.forFeature([ContentEffects])
    ],
    exports: [
        FundingSourcesViewComponent,
        MaintenanceNotificationViewComponent
    ]
})
export class ContentModule { }
