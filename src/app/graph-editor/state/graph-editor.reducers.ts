import * as fromRoot from '../../state/app.state';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { GraphEditorActions, GraphEditorActionTypes } from './graph-editor.actions';

export const STATE_SLICE_NAME = 'graphEditor';

export interface State extends fromRoot.State {
    tracing: GraphEditorState;
}

export interface GraphEditorState {
    active: boolean;
}

const initialState: GraphEditorState = {
    active: false
};

// SELECTORS
export const getGraphEditorFeatureState = createFeatureSelector<GraphEditorState>(STATE_SLICE_NAME);

export const isActive = createSelector(
    getGraphEditorFeatureState,
    state => state.active
);

// REDUCER
export function reducer(state: GraphEditorState = initialState, action: GraphEditorActions): GraphEditorState {
    switch (action.type) {
        case GraphEditorActionTypes.Active:
            return {
                ...state,
                active: action.payload
            };

        default:
            return state;
    }
}
