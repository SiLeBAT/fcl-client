import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";

import { RecoveryViewComponent } from "./recovery-view.component";
import { MaterialModule } from "../../../shared/material.module";
import { SharedModule } from "../../../shared/shared.module";
import { RouterTestingModule } from "@angular/router/testing";

describe("RecoveryViewComponent", () => {
    let component: RecoveryViewComponent;
    let fixture: ComponentFixture<RecoveryViewComponent>;

    beforeEach(async(() => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        TestBed.configureTestingModule({
            declarations: [RecoveryViewComponent],
            imports: [MaterialModule, SharedModule, RouterTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        })
            .compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(RecoveryViewComponent);
                component = fixture.componentInstance;
            });
    }));

    it("should create the component", () => {
        expect(component).toBeTruthy();
    });

    it("should render the component correctly", () => {
        expect(fixture).toMatchSnapshot();
    });
});
