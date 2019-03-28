import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollbarHelper } from '@swimlane/ngx-datatable/release/services/scrollbar-helper.service';
import { StoreModule } from '@ngrx/store';

import { SharedModule } from './../shared/shared.module';
import { MainDashComponent } from './main-dash/main-dash.component';
import { MainPageRoutingModule } from './main-page.routing.module';
import { MainPageComponent } from './presentation/main-page/main-page.component';
import { TracingModule } from '../tracing/tracing.module';
import { GraphEditorModule } from '../graph-editor/graph-editor.module';
import { PageHeaderContainerComponent } from './container/page-header-container/page-header-container.component';
import { PageBodyContainerComponent } from './container/page-body-container/page-body-container.component';
import { PageFooterContainerComponent } from './container/page-footer-container/page-footer-container.component';
import { PageHeaderComponent } from './presentation/page-header/page-header.component';
import { PageFooterComponent } from './presentation/page-footer/page-footer.component';
import { PageBodyComponent } from './presentation/page-body/page-body.component';
import { AvatarContainerComponent } from './container/avatar-container/avatar-container.component';
import { AvatarComponent } from './presentation/avatar/avatar.component';
import { ToolbarActionContainerComponent } from './container/toolbar-action-container/toolbar-action-container.component';
import { ToolbarActionComponent } from './presentation/toolbar-action/toolbar-action.component';

// import { STATE_SLICE_NAME, reducer } from './state/main-page.reducers';

@NgModule({
    imports: [
        CommonModule,
        MainPageRoutingModule,
        SharedModule,
        TracingModule,
        GraphEditorModule
        // StoreModule.forFeature(STATE_SLICE_NAME, reducer)
    ],
    declarations: [
        MainDashComponent,
        MainPageComponent,
        PageHeaderContainerComponent,
        PageBodyContainerComponent,
        PageFooterContainerComponent,
        PageHeaderComponent,
        PageFooterComponent,
        PageBodyComponent,
        AvatarContainerComponent,
        AvatarComponent,
        ToolbarActionContainerComponent,
        ToolbarActionComponent
    ],
    providers: [
        ScrollbarHelper
    ],
    exports: [
        MainPageComponent
    ]
})
export class MainPageModule { }
