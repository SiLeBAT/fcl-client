import { Observable, combineLatest } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store, select } from '@ngrx/store';
import * as fromTracing from '../../state/tracing.reducers';
import * as tracingSelectors from '../../state/tracing.selectors';
import * as tracingActions from '../../state/tracing.actions';
import { TableColumn, ExtendedOperationType, StationTableRow, JunktorType, ComplexFilterCondition } from '../../data.model';
import { map, takeWhile } from 'rxjs/operators';

@Component({
    selector: 'fcl-complex-filter',
    templateUrl: './complex-filter.component.html'
})
export class ComplexFilterComponent implements OnInit, OnDestroy {

    stationColumns$: Observable<TableColumn[]> = this.store.select(tracingSelectors.getStationColumnsForComplexFilter);
    stationColumns: TableColumn[];
    ExtendedOperationType = ExtendedOperationType;
    extendedOperationTypeKeys: string[];
    JunktorType = JunktorType;
    junktorTypeKeys: string[];
    propToValues: Map<string, string[]>;
    componentActive: boolean = true;

    constructor(
        private store: Store<fromTracing.State>
    ) { }

    ngOnInit() {

        this.extendedOperationTypeKeys = Object.keys(ExtendedOperationType);
        this.junktorTypeKeys = Object.keys(JunktorType);

        this.propToValues = new Map();

        const stationColumns$: Observable<TableColumn[]> = this.store
            .pipe(
                select(tracingSelectors.getStationColumnsForComplexFilter)
        );

        const stationRows$: Observable<StationTableRow[]> = this.store
            .pipe(
                select(tracingSelectors.getStationRowsForComplexFilter)
        );

        combineLatest([
            stationColumns$,
            stationRows$
        ]).pipe(
            map(([stationColumns, stationRows]) => {
                this.stationColumns = stationColumns;
                this.propToValues = new Map();

                stationColumns.forEach(column => {
                    const property = column.id;
                    const propValues: Set<string> = new Set(stationRows.map(row => {
                        return row[property] as string;
                    }));
                    this.propToValues.set(column.id, [...propValues]);
                });
            }),
            takeWhile(() => this.componentActive)
        ).subscribe();
    }

    handleComplexFilterConditions(complexFilterConditions: ComplexFilterCondition[]) {
        this.store.dispatch(new tracingActions.SetStationComplexFilterConditionsSSA({ stationFilterConditions: complexFilterConditions }));
    }

    ngOnDestroy() {
        this.componentActive = false;
    }

}
