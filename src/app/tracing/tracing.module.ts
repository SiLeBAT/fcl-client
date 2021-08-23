import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { ColorPickerModule } from 'ngx-color-picker';
import { MainTracingComponent } from './components/main-tracing.component';
import { SharedModule } from '../shared/shared.module';
import { TracingRoutingModule } from './tracing.routing.module';
import { DialogActionsComponent } from './dialog/dialog-actions/dialog-actions.component';
import { DialogAlertComponent } from './dialog/dialog-alert/dialog-alert.component';
import { DialogPromptComponent } from './dialog/dialog-prompt/dialog-prompt.component';
import { DialogSelectComponent } from './dialog/dialog-select/dialog-select.component';
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
import { ShapeSelectorViewComponent } from './configuration/shape-selector-view/shape-selector-view.component';
import { ValueEditorViewComponent } from './configuration/value-editor-view/value-editor-view.component';
import { JunctorSelectorViewComponent } from './configuration/junktor-selector-view/junktor-selector-view.component';
import { ConfigurationEffects } from './configuration/configuration.effects';
import { HighlightingStationComponent } from './configuration/highlighting-station/highlighting-station.component';
import { HighlightingDeliveryComponent } from './configuration/highlighting-delivery/highlighting-delivery.component';
import { HighlightingStationViewComponent } from './configuration/highlighting-station-view/highlighting-station-view.component';
import { AnonymousButtonViewComponent } from './configuration/anonymous-button-view/anonymous-button-view.component';
import { ResizeSensorDirective } from './graph/components/resize-sensor.directive';
import { GraphViewComponent } from './graph/components/graph-view/graph-view.component';
import { GeoMapComponent } from './graph/components/geomap/geomap.component';
import { ContextMenuViewComponent } from './graph/components/context-menu/context-menu-view.component';
import { GeoMapLicRefViewComponent } from './graph/components/geomap-licref/geomap-licref-view.component';
import { RuleNameViewComponent } from './configuration/rule-name-view/rule-name-view.component';
import { ColorsAndShapesListViewComponent } from './configuration/colors-and-shapes-list-view/colors-and-shapes-list-view.component';
import { ColorsAndShapesEditViewComponent } from './configuration/colors-and-shapes-edit-view/colors-and-shapes-edit-view.component';
import { DialogYesNoComponent } from './dialog/dialog-yes-no/dialog-yes-no.component';
import { NgxDatatableRowEventProviderDirective } from './configuration/ngxdatatable-row-event-provider.directive';
import { ColorSelectorViewComponent } from './configuration/color-selector-view/color-selector-view.component';
import { NgxDatatableScrollFixDirective } from './shared/ngxdatatable-scroll-fix.directive';
import { UnknownLatLonFrameViewComponent } from './graph/components/unknown-lat-lon-frame-view/unknown-lat-lot-frame-view.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        SharedModule,
        NgxDatatableModule,
        TracingRoutingModule,
        ColorPickerModule,
        StoreModule.forFeature(STATE_SLICE_NAME, reducer),
        EffectsModule.forFeature([TracingEffects, GroupingEffects, IOEffects, VisioEffects, ConfigurationEffects])
    ],
    declarations: [
        MainTracingComponent,
        DialogActionsComponent,
        DialogAlertComponent,
        DialogPromptComponent,
        DialogSelectComponent,
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
        ShapeSelectorViewComponent,
        ValueEditorViewComponent,
        JunctorSelectorViewComponent,
        ClearAllFilterViewComponent,
        HighlightingStationComponent,
        HighlightingDeliveryComponent,
        HighlightingStationViewComponent,
        AnonymousButtonViewComponent,
        NgxDatatableScrollFixDirective,
        ResizeSensorDirective,
        GraphViewComponent,
        GeoMapComponent,
        GeoMapLicRefViewComponent,
        ContextMenuViewComponent,
        RuleNameViewComponent,
        ColorsAndShapesListViewComponent,
        ColorsAndShapesEditViewComponent,
        DialogYesNoComponent,
        NgxDatatableRowEventProviderDirective,
        ColorSelectorViewComponent,
        UnknownLatLonFrameViewComponent
    ],
    exports: []
})
export class TracingModule { }
