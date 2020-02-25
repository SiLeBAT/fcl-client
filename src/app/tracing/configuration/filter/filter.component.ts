import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import * as fromTracing from '../../state/tracing.reducers';
import * as tracingSelectors from '../../state/tracing.selectors';
import * as tracingActions from '../../state/tracing.actions';
import { map } from 'rxjs/operators';
import { TabConfig } from '../tab-layout/tab-layout.component';

@Component({
    selector: 'fcl-filter',
    templateUrl: './filter.component.html'
})
export class FilterComponent implements OnInit {

    @ViewChild('stationTemplate', { static: true }) stationTemplate: TemplateRef<any>;
    @ViewChild('deliveryTemplate', { static: true }) deliveryTemplate: TemplateRef<any>;
    tabConfigs: TabConfig[];

    configurationTabIndices$ = this.store.select(tracingSelectors.getConfigurationTabIndices);
    activeTabIndex$ = this.configurationTabIndices$
        .pipe(
            map((configurationTabIndices: fromTracing.ConfigurationTabIndex) => configurationTabIndices.activeFilterTabIndex)
        );

    tabGroupId = 'fcl-tab-group-filter';

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

    dispatchFilterTabIndex(filterTabIndex: number) {
        this.store.dispatch(new tracingActions.SetActiveFilterTabIndexSSA({ activeFilterTabIndex: filterTabIndex }));
    }
}
