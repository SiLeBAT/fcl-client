import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import * as fromTracing from '../../state/tracing.reducers';
import * as tracingSelectors from '../../state/tracing.selectors';
import * as tracingActions from '../../state/tracing.actions';
import { map } from 'rxjs/operators';
import { TabConfig } from '../tab-layout/tab-layout.component';

@Component({
    selector: 'fcl-configuration',
    templateUrl: './configuration.component.html'
})
export class ConfigurationComponent implements OnInit {

    @ViewChild('filterTemplate', { static: true }) filterTemplate: TemplateRef<any>;
    @ViewChild('highlightingTemplate', { static: true }) highlightingTemplate: TemplateRef<any>;
    @ViewChild('settingsTemplate', { static: true }) settingsTemplate: TemplateRef<any>;
    tabConfigs: TabConfig[];

    configurationTabIndices$ = this.store.select(tracingSelectors.getConfigurationTabIndices);
    activeTabIndex$ = this.configurationTabIndices$
        .pipe(
            map((configurationTabIndices: fromTracing.ConfigurationTabIndex) => configurationTabIndices.activeMainTabIndex)
        );

    tabGroupId = 'fcl-tab-group-main';

    constructor(
        private store: Store<fromTracing.State>
    ) { }

    ngOnInit() {
        this.tabConfigs = [
            {
                tabLabel: 'Filter',
                tabTemplate: this.filterTemplate
            },
            {
                tabLabel: 'Highlighting',
                tabTemplate: this.highlightingTemplate
            },
            {
                tabLabel: 'Graph Settings',
                tabTemplate: this.settingsTemplate
            }
        ];
    }

    dispatchMainTabIndex(mainTabIndex: number) {
        this.store.dispatch(new tracingActions.SetActiveMainTabIndexSSA({ activeMainTabIndex: mainTabIndex }));
    }
}
