import { Component, OnInit, OnDestroy } from '@angular/core';
import { Constants } from '@app/tracing/util/constants';
import { TableSettings, ShowType } from '../../data.model';
import { Store, select } from '@ngrx/store';
import { takeWhile } from 'rxjs/operators';
import * as fromTracing from '../../state/tracing.reducers';
import * as TracingSelectors from '../../state/tracing.selectors';
import * as tracingActions from '../../state/tracing.actions';

@Component({
    selector: 'fcl-predefined-filter',
    templateUrl: './predefined-filter.component.html'
})
export class PredefinedFilterComponent implements OnInit, OnDestroy {
    showTypes = Constants.SHOW_TYPES;
    tableSettings: TableSettings;
    private componentActive: boolean = true;

    constructor(
        private store: Store<fromTracing.State>
    ) { }

    ngOnInit() {
        this.store.pipe(
            select(TracingSelectors.getTableSettings),
            takeWhile(() => this.componentActive)
        ).subscribe(
            (tableSettings: TableSettings) => {
                this.tableSettings = tableSettings;
            }, (error => {
                throw new Error(`error loading table settings: ${error}`);
            })
        );
    }

    setTableShowType(newShowType: ShowType) {
        this.tableSettings.showType = newShowType;
        this.store.dispatch(new tracingActions.SetTableShowTypeSOA(this.tableSettings.showType));
    }

    ngOnDestroy() {
        this.componentActive = false;
    }
}
