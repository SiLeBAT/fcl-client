import { GraphEditorState, reducer } from "./graph-editor.reducer";
import { GraphEditorActivated } from "./graph-editor.actions";
import { ActivationStatus } from "../../shared/model/types";

describe("main-page reducer", () => {
    let currentState: GraphEditorState;

    beforeEach(() => {
        currentState = {
            active: false,
        };
    });

    it("should have valid state after GraphEditorActivated action", () => {
        const activationStatus: ActivationStatus = {
            isActivated: true,
        };

        const currentAction: GraphEditorActivated = new GraphEditorActivated(
            activationStatus,
        );

        const expectedState: GraphEditorState = {
            active: true,
        };

        const result: GraphEditorState = reducer(currentState, currentAction);

        expect(result).toMatchObject(expectedState);
    });
});
