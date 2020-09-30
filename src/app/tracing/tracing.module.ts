import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { MainTracingComponent } from './components/main-tracing.component';
import { SharedModule } from '../shared/shared.module';
import { TracingRoutingModule } from './tracing.routing.module';
import { DialogActionsComponent } from './dialog/dialog-actions/dialog-actions.component';
import { DialogAlertComponent } from './dialog/dialog-alert/dialog-alert.component';
import { DialogPromptComponent } from './dialog/dialog-prompt/dialog-prompt.component';
import { DialogSelectComponent } from './dialog/dialog-select/dialog-select.component';
import { DialogSingleSelectComponent } from './dialog/dialog-single-select/dialog-single-select.component';
import { StationPropertiesComponent } from './dialog/station-properties/station-properties.component';
import { DeliveryPropertiesComponent } from './dialog/delivery-properties/delivery-properties.component';
import { DeliveriesPropertiesComponent } from './dialog/deliveries-properties/deliveries-properties.component';
import { ReportConfigurationComponent } from './visio/report-configuration/report-configuration.component';
import { STATE_SLICE_NAME, reducer } from './state/tracing.reducers';
import { StoreModule } from '@ngrx/store';
import { GraphSettingsComponent } from './components/graph-settings.component';
import { TracingEffects } from './tracing.effects';
import { GroupingEffects } from './grouping/grouping.effects';
import { IOEffects } from './io/io.effects';
import { VisioEffects } from './visio/visio.effects';
import { EffectsModule } from '@ngrx/effects';
import { NestedMatMenuViewComponent } from './graph/components/nested-mat-menu-view/nested-mat-menu-view.component';
import { SchemaGraphComponent } from './graph/components/schema-graph/schema-graph.component';
import { GraphLegendViewComponent } from './graph/components/graph-legend-view/graph-legend-view.component';
import { NodeSymbolViewComponent } from './shared/node-symbol-view/node-symbol-view.component';
import { ZoomViewComponent } from './graph/components/zoom-view/zoom-view.component';
import { GisGraphComponent } from './graph/components/gis-graph/gis-graph.component';
import { GraphContextMenuComponent } from './graph/components/graph-context-menu/graph-context-menu.component';
import { EdgeSymbolViewComponent } from './graph/components/edge-symbol-view/edge-symbol-view.component';
import { CreatedImageViewComponent } from './shared/created-image-view/created-image-view.component';
import { MergeStationsDialogComponent } from './grouping/merge-stations-dialog/merge-stations-dialog.component';
import { TabLayoutComponent } from './configuration/tab-layout/tab-layout.component';
import { ConfigurationComponent } from './configuration/configuration/configuration.component';
import { FilterComponent } from './configuration/filter/filter.component';
import { HighlightingComponent } from './configuration/highlighting/highlighting.component';
import { FilterStationComponent } from './configuration/filter-station/filter-station.component';
import { FilterDeliveryComponent } from './configuration/filter-delivery/filter-delivery.component';
import { FilterElementsViewComponent } from './configuration/filter-elements-view/filter-elements-view.component';
import { FilterTableViewComponent } from './configuration/filter-table-view/filter-table-view.component';
import { StandardFilterViewComponent } from './configuration/standard-filter-view/standard-filter-view.component';
import { PredefinedFilterViewComponent } from './configuration/predefined-filter-view/predefined-filter-view.component';
import { ComplexFilterViewComponent } from './configuration/complex-filter-view/complex-filter-view.component';
import { ClearAllFilterViewComponent } from './configuration/clear-all-filter-view/clear-all-filter-view.component';
import { LabelConfigurationViewComponent } from './visio/label-configuration-view/label-configuration-view.component';
import { PropertyElementViewComponent } from './visio/property-element-view/property-element-view.component';
import { TextElementViewComponent } from './visio/text-element-view/text-element-view.component';
import { PropertySelectorViewComponent } from './configuration/property-selector-view/property-selector-view.component';
import { OperatorSelectorViewComponent } from './configuration/operator-selector-view/operator-selector-view.component';
import { ValueEditorViewComponent } from './configuration/value-editor-view/value-editor-view.component';
import { JunctorSelectorViewComponent } from './configuration/junktor-selector-view/junktor-selector-view.component';
import { ConfigurationEffects } from './configuration/configuration.effects';
import { ResizeSensorDirective } from './graph/components/graph-view/resize-sensor.directive';
import { GraphViewComponent } from './graph/components/graph-view/graph-view.component';
import { GeoMapComponent } from './graph/components/geomap/geomap.component';
import { ContextMenuViewComponent } from './graph/components/context-menu/context-menu-view.component';
import { GeoMapLicRefViewComponent } from './graph/components/geomap-licref/geomap-licref-view.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        SharedModule,
        NgxDatatableModule,
        TracingRoutingModule,
        StoreModule.forFeature(STATE_SLICE_NAME, reducer),
        EffectsModule.forFeature([TracingEffects, GroupingEffects, IOEffects, VisioEffects, ConfigurationEffects])
    ],
    declarations: [
        MainTracingComponent,
        DialogActionsComponent,
        DialogAlertComponent,
        DialogPromptComponent,
        DialogSelectComponent,
        DialogSingleSelectComponent,
        StationPropertiesComponent,
        DeliveryPropertiesComponent,
        DeliveriesPropertiesComponent,
        ReportConfigurationComponent,
        LabelConfigurationViewComponent,
        PropertyElementViewComponent,
        TextElementViewComponent,
        GraphSettingsComponent,
        NestedMatMenuViewComponent,
        SchemaGraphComponent,
        GisGraphComponent,
        GraphContextMenuComponent,
        GraphLegendViewComponent,
        NodeSymbolViewComponent,
        EdgeSymbolViewComponent,
        ZoomViewComponent,
        CreatedImageViewComponent,
        MergeStationsDialogComponent,
        TabLayoutComponent,
        ConfigurationComponent,
        FilterComponent,
        HighlightingComponent,
        FilterStationComponent,
        FilterDeliveryComponent,
        FilterElementsViewComponent,
        FilterTableViewComponent,
        StandardFilterViewComponent,
        PredefinedFilterViewComponent,
        ComplexFilterViewComponent,
        PropertySelectorViewComponent,
        OperatorSelectorViewComponent,
        ValueEditorViewComponent,
        JunctorSelectorViewComponent,
        ClearAllFilterViewComponent,
        ResizeSensorDirective,
        GraphViewComponent,
        GeoMapComponent,
        GeoMapLicRefViewComponent,
        ContextMenuViewComponent
    ],
    exports: [],
    entryComponents: [
        DialogActionsComponent,
        DialogAlertComponent,
        DialogPromptComponent,
        DialogSelectComponent,
        DialogSingleSelectComponent,
        StationPropertiesComponent,
        DeliveryPropertiesComponent,
        DeliveriesPropertiesComponent,
        MergeStationsDialogComponent,
        ReportConfigurationComponent
    ]
})
export class TracingModule { }
