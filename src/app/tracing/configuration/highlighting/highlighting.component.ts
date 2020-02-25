import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import * as fromTracing from '../../state/tracing.reducers';
import * as tracingSelectors from '../../state/tracing.selectors';
import * as tracingActions from '../../state/tracing.actions';
import { map } from 'rxjs/operators';
import { TabConfig } from '../tab-layout/tab-layout.component';

@Component({
    selector: 'fcl-highlighting',
    templateUrl: './highlighting.component.html'
})
export class HighlightingComponent implements OnInit {

    @ViewChild('stationTemplate', { static: true }) stationTemplate: TemplateRef<any>;
    @ViewChild('deliveryTemplate', { static: true }) deliveryTemplate: TemplateRef<any>;
    tabConfigs: TabConfig[];

    configurationTabIndices$ = this.store.select(tracingSelectors.getConfigurationTabIndices);
    activeTabIndex$ = this.configurationTabIndices$
        .pipe(
            map((configurationTabIndices: fromTracing.ConfigurationTabIndex) => configurationTabIndices.activeHighlightingTabIndex)
        );

    tabGroupId = 'fcl-tab-group-highlighting';

    constructor(
        private store: Store<fromTracing.State>
    ) { }

    ngOnInit() {
        this.tabConfigs = [
            {
                tabLabel: 'Stations',
                tabTemplate: this.stationTemplate
            },
            {
                tabLabel: 'Deliveries',
                tabTemplate: this.deliveryTemplate
            }
        ];
    }

    dispatchHighlightingTabIndex(highlightingTabIndex: number) {
        this.store.dispatch(new tracingActions.SetActiveHighlightingTabIndexSSA({ activeHighlightingTabIndex: highlightingTabIndex }));
    }
}
