import * as fromRoot from './app.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TracingActions, TracingActionTypes } from './tracing.actions';
import { VisioReport } from '../visio/layout-engine/datatypes';
import { FclElements } from '../util/datatypes';

export const STATE_SLICE_NAME = 'tracing';

export interface State extends fromRoot.State {
    tracing: TracingState;
}

export interface TracingState {
    fclData: FclElements;
    visioReport: VisioReport | null;
}

const initialState: TracingState = {
    fclData: null,
    visioReport: null
};

// SELECTORS
export const getTracingFeatureState = createFeatureSelector<TracingState>(STATE_SLICE_NAME);

export const getVisioReport = createSelector(
  getTracingFeatureState,
  state => state.visioReport
);

// REDUCER
export function reducer(state: TracingState = initialState, action: TracingActions): TracingState {
    switch (action.type) {

        case TracingActionTypes.GenerateVisioLayoutSuccess:
            return {
                ...state,
                visioReport: action.payload
            };

        default:
            return state;
    }
}
