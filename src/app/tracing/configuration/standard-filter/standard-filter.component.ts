import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Store, select } from '@ngrx/store';
import * as fromTracing from '../../state/tracing.reducers';
import * as tracingSelectors from '../../state/tracing.selectors';
import * as tracingActions from '../../state/tracing.actions';
import { tap, takeWhile } from 'rxjs/operators';

@Component({
    selector: 'fcl-standard-filter',
    templateUrl: './standard-filter.component.html'
})
export class StandardFilterComponent implements OnInit, OnDestroy {

    @Input() filterLabel: string;
    currentFilterTerm: string;
    private componentActive: boolean = true;

    constructor(
        private store: Store<fromTracing.State>
    ) { }

    ngOnInit() {
        this.store
            .pipe(
                select(tracingSelectors.getStandardFilterTerm),
                tap(filterTerm => this.currentFilterTerm = filterTerm),
                takeWhile(() => this.componentActive)
        ).subscribe();
    }

    processStandardFilterTerm(standardFilterTerm) {
        this.store.dispatch(new tracingActions.SetStationStandardFilterTermSSA({ filterTerm: standardFilterTerm }));
    }

    ngOnDestroy() {
        this.componentActive = false;
    }
}
