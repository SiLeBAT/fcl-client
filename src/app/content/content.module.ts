import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ContentRoutingModule } from "./content-routing.module";
import { DataProtectionDeclarationComponent } from "./data-protection-declaration/data-protection-declaration.component";
import { DataProtectionNoticeComponent } from "./data-protection-notice/data-protection-notice.component";
import { StoreModule } from "@ngrx/store";
import { reducer, STATE_SLICE_NAME } from "./state/content.reducer";
import { EffectsModule } from "@ngrx/effects";
import { ContentEffects } from "./state/content.effects";
import { FundingSourcesViewComponent } from "./funding-sources-view/funding-sources-view.component";
import { MaintenanceNotificationViewComponent } from "./maintenance-notification-view/maintenance-notification-view.component";
import { FaqComponent } from "./faq/components/faq.component";
import { FaqViewComponent } from "./faq/components/faq-view.component";
import { FaqSectionViewComponent } from "./faq/components/faq-section-view.component";
import { SharedModule } from "@app/shared/shared.module";

@NgModule({
    declarations: [
        DataProtectionDeclarationComponent,
        DataProtectionNoticeComponent,
        FundingSourcesViewComponent,
        MaintenanceNotificationViewComponent,
        FaqComponent,
        FaqViewComponent,
        FaqSectionViewComponent,
    ],
    imports: [
        CommonModule,
        ContentRoutingModule,
        SharedModule,
        StoreModule.forFeature(STATE_SLICE_NAME, reducer),
        EffectsModule.forFeature([ContentEffects]),
    ],
    exports: [
        FundingSourcesViewComponent,
        MaintenanceNotificationViewComponent,
    ],
})
export class ContentModule {}
