import { createFeatureSelector, createSelector } from "@ngrx/store";
import { MainPageActions, MainPageActionTypes } from "./main-page.actions";

export const STATE_SLICE_NAME = "main-page";

export interface MainPageState {
    dashboardActive: boolean;
}

const initialState: MainPageState = {
    dashboardActive: false,
};

// SELECTORS
export const getMainPageFeatureState =
    createFeatureSelector<MainPageState>(STATE_SLICE_NAME);

export const getDashboardActive = createSelector(
    getMainPageFeatureState,
    (state) => state.dashboardActive,
);

// REDUCER
export function reducer(
    state: MainPageState = initialState,
    action: MainPageActions,
): MainPageState {
    switch (action.type) {
        case MainPageActionTypes.DashboardActivated:
            return {
                ...state,
                dashboardActive: action.payload.isActivated,
            };

        default:
            return state;
    }
}
