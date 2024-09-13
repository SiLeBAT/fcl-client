import { createFeatureSelector, createSelector } from "@ngrx/store";
import {
    GraphEditorActions,
    GraphEditorActionTypes,
} from "./graph-editor.actions";

export const STATE_SLICE_NAME = "graphEditor";

export interface GraphEditorState {
    active: boolean;
}

const initialState: GraphEditorState = {
    active: false,
};

// SELECTORS
export const getGraphEditorFeatureState =
    createFeatureSelector<GraphEditorState>(STATE_SLICE_NAME);

export const isActive = createSelector(
    getGraphEditorFeatureState,
    (state) => state.active,
);

// REDUCER
export function reducer(
    state: GraphEditorState = initialState,
    action: GraphEditorActions,
): GraphEditorState {
    switch (action.type) {
        case GraphEditorActionTypes.GraphEditorActivated:
            return {
                ...state,
                active: action.payload.isActivated,
            };

        default:
            return state;
    }
}
