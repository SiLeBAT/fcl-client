import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import * as fromTracing from '../../state/tracing.reducers';
import * as tracingSelectors from '../../state/tracing.selectors';
import * as tracingActions from '../../state/tracing.actions';
import {map} from 'rxjs/operators';
import {TabConfig} from '../tab-layout/tab-layout.component';
import {ActiveFilterTabId, AddTypedId} from '../configuration.model';
import {DeliveriesTabId, StationsTabId} from '../configuration.constants';

@Component({
  selector: 'fcl-filter',
  templateUrl: './filter.component.html',
})
export class FilterComponent implements OnInit {
  @ViewChild('stationTemplate', {static: true})
  stationTemplate: TemplateRef<any>;
  @ViewChild('deliveryTemplate', {static: true})
  deliveryTemplate: TemplateRef<any>;
  tabConfigs: AddTypedId<TabConfig, ActiveFilterTabId>[] = [];

  activeTabIndex$ = this.store
    .select(tracingSelectors.getActiveFilterTabId)
    .pipe(
      map(
        tabId =>
          this.tabConfigs.findIndex(tabConfig => tabConfig.id === tabId) || 0
      )
    );

  tabGroupId = 'fcl-tab-group-filter';

  constructor(private store: Store<fromTracing.State>) {}

  ngOnInit() {
    this.tabConfigs = [
      {
        id: StationsTabId,
        tabLabel: 'Stations',
        tabTemplate: this.stationTemplate,
      },
      {
        id: DeliveriesTabId,
        tabLabel: 'Deliveries',
        tabTemplate: this.deliveryTemplate,
      },
    ];
  }

  onTabChange(tabIndex: number) {
    const tabId = this.tabConfigs[tabIndex].id;
    this.store.dispatch(
      new tracingActions.SetActiveFilterTabIdSOA({activeFilterTabId: tabId})
    );
  }

  onTabAnimationDone(): void {
    this.store.dispatch(new tracingActions.SetTabAnimationDoneSOA());
  }
}
