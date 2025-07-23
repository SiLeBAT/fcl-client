import { ComponentFixture, TestBed } from "@angular/core/testing";
import { OperatorSelectorViewComponent } from "./operator-selector-view.component";
import { OperationType } from "../../data.model";
import { MaterialModule } from "../../../shared/material.module";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { By } from "@angular/platform-browser";
import { MatLegacySelect } from "@angular/material/legacy-select";

const INPUTS = {
    value: OperationType.CONTAINS,
    availableOperationTypes: Object.values(OperationType),
} as const;

describe("OperatorSelectorViewComponent", () => {
    let fixture: ComponentFixture<OperatorSelectorViewComponent>;
    let component: OperatorSelectorViewComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [OperatorSelectorViewComponent],
            imports: [MaterialModule, NoopAnimationsModule],
        });
        fixture = TestBed.createComponent(OperatorSelectorViewComponent);
        component = fixture.componentInstance;
        component.availableOperatorTypes = INPUTS.availableOperationTypes;
        component.value = INPUTS.value;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should match template accessors", () => {
        expect(component.value).toEqual(INPUTS.value);
        expect(component.availableOperators).toMatchSnapshot();
    });

    it("should match snapshot", async () =>
        fixture
            .whenRenderingDone()
            .then(() => expect(fixture).toMatchSnapshot()));

    it("should match options", async () => {
        const selectElements = fixture.debugElement.queryAll(
            By.directive(MatLegacySelect),
        );
        const selectComponent = selectElements[0]
            .componentInstance as MatLegacySelect;
        const operatorOptions = Array.from(selectComponent.options).map(
            (option) => ({
                value: option.value,
                label: option.getLabel(),
            }),
        );
        expect(operatorOptions).toMatchSnapshot();
    });
});
