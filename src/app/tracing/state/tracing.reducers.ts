import * as fromRoot from '../../state/app.state';
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
    sideBars: SideBarState;
}

export interface SideBarState {
    leftSideBarOpen: boolean;
    rightSideBarOpen: boolean;
}

const initialState: TracingState = {
    fclData: null,
    visioReport: null,
    sideBars: {
        leftSideBarOpen: false,
        rightSideBarOpen: false
    }
};

// SELECTORS
export const getTracingFeatureState = createFeatureSelector<TracingState>(STATE_SLICE_NAME);

export const getVisioReport = createSelector(
  getTracingFeatureState,
  state => state.visioReport
);

export const getSideBarStates = createSelector(
    getTracingFeatureState,
    (state: TracingState) => state.sideBars
);

// REDUCER
export function reducer(state: TracingState = initialState, action: TracingActions): TracingState {
    switch (action.type) {

        case TracingActionTypes.GenerateVisioLayoutSuccess:
            return {
                ...state,
                visioReport: action.payload
            };

        case TracingActionTypes.ToggleLeftSideBar:
            return {
                ...state,
                sideBars: {
                    ...state.sideBars,
                    leftSideBarOpen: action.payload
                }
            };

        case TracingActionTypes.ToggleRightSideBar:
            return {
                ...state,
                sideBars: {
                    ...state.sideBars,
                    rightSideBarOpen: action.payload
                }
            };

        default:
            return state;
    }
}
