import { ImportIssue } from "./data-importer/xlsx-import/model";
import { IOActions, IOActionTypes } from "./io.actions";

export interface IOState {
    issuesInImport: ImportIssue[];
    omittedRowsInImport: number;
}

const initialState: IOState = {
    issuesInImport: [],
    omittedRowsInImport: 0,
};

export function createInitialImportState(): IOState {
    return initialState;
}

// REDUCER
export function reducer(
    state: IOState = initialState,
    action: IOActions,
): IOState {
    switch (action.type) {
        case IOActionTypes.ImportWithIssuesMSA:
            return {
                ...state,
                issuesInImport: action.payload.issues.issueList,
                omittedRowsInImport: action.payload.issues.omittedRows,
            };

        default:
            return state;
    }
}
