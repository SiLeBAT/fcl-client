import { createFeatureSelector, createSelector } from "@ngrx/store";
import { ContentActions, ContentActionTypes } from "./content.actions";

export const STATE_SLICE_NAME = "content";

export interface ContentState {
    gdprDate: string;
}

const initialState: ContentState = {
    gdprDate: "",
};

// SELECTORS
export const getContentFeatureState =
    createFeatureSelector<ContentState>(STATE_SLICE_NAME);

export const getGDPRDate = createSelector(
    getContentFeatureState,
    (state) => state.gdprDate,
);

// REDUCER
export function reducer(
    state: ContentState = initialState,
    action: ContentActions,
): ContentState {
    switch (action.type) {
        case ContentActionTypes.UpdateGDPRDateSOA:
            return {
                ...state,
                gdprDate: action.payload.gdprDate,
            };

        default:
            return state;
    }
}
