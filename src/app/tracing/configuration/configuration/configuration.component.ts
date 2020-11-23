import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import * as fromTracing from '../../state/tracing.reducers';
import * as tracingSelectors from '../../state/tracing.selectors';
import * as tracingActions from '../../state/tracing.actions';
import { map } from 'rxjs/operators';
import { TabConfig } from '../tab-layout/tab-layout.component';
import { ActiveConfigurationTabId, AddTypedId } from '../configuration.model';
import { FilterTabId, HighlightingTabId, SettingsTabId } from '../configuration.constants';

@Component({
    selector: 'fcl-configuration',
    templateUrl: './configuration.component.html'
})
export class ConfigurationComponent implements OnInit {

    @ViewChild('filterTemplate', { static: true }) filterTemplate: TemplateRef<any>;
    @ViewChild('highlightingTemplate', { static: true }) highlightingTemplate: TemplateRef<any>;
    @ViewChild('settingsTemplate', { static: true }) settingsTemplate: TemplateRef<any>;
    tabConfigs: AddTypedId<TabConfig, ActiveConfigurationTabId>[] = [];

    activeTabIndex$ = this.store.select(tracingSelectors.getActiveConfigurationTabId).pipe(
        map(tabId => this.tabConfigs.findIndex(tabConfig => tabConfig.id === tabId) || 0)
    );

    tabGroupId = 'fcl-tab-group-main';

    constructor(
        private store: Store<fromTracing.State>
    ) { }

    ngOnInit() {
        this.tabConfigs = [
            {
                id: FilterTabId,
                tabLabel: 'Filter',
                tabTemplate: this.filterTemplate
            },
            // {
            //     id: HighlightingTabId,
            //     tabLabel: 'Highlighting',
            //     tabTemplate: this.highlightingTemplate
            // },
            {
                id: SettingsTabId,
                tabLabel: 'Graph Settings',
                tabTemplate: this.settingsTemplate
            }
        ];
    }

    onTabChange(tabIndex: number) {
        const tabId = this.tabConfigs[tabIndex].id;
        this.store.dispatch(new tracingActions.SetActiveConfigurationTabIdSOA({ activeConfigurationTabId: tabId }));
    }
}
