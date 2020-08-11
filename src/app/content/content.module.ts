import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentRoutingModule } from './content-routing.module';
import { DataProtectionDeclarationComponent } from './data-protection-declaration/data-protection-declaration.component';
import { DataProtectionNoticeComponent } from './data-protection-notice/data-protection-notice.component';
import { StoreModule } from '@ngrx/store';
import { reducer, STATE_SLICE_NAME } from './state/content.reducer';
import { EffectsModule } from '@ngrx/effects';
import { ContentEffects } from './state/content.effects';

@NgModule({
    declarations: [
        DataProtectionDeclarationComponent,
        DataProtectionNoticeComponent
    ],
    imports: [
        CommonModule,
        ContentRoutingModule,
        StoreModule.forFeature(STATE_SLICE_NAME, reducer),
        EffectsModule.forFeature([ContentEffects])
    ],
    exports: []
})
export class ContentModule { }
