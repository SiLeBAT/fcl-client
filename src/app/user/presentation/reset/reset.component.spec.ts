import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ResetComponent } from "./reset.component";
import { MaterialModule } from "../../../shared/material.module";
import { SharedModule } from "../../../shared/shared.module";
import { NewPasswordRequestDTO } from "../../models/user.model";
import { RouterTestingModule } from "@angular/router/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("ResetComponent", () => {
    let component: ResetComponent;
    let fixture: ComponentFixture<ResetComponent>;

    beforeEach(async(() => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        TestBed.configureTestingModule({
            declarations: [ResetComponent],
            imports: [
                MaterialModule,
                SharedModule,
                RouterTestingModule,
                NoopAnimationsModule,
            ],
        })
            .compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(ResetComponent);
                component = fixture.componentInstance;
            });
    }));

    it("should create the component", () => {
        expect(component).toBeTruthy();
    });

    it("should render the component correctly", () => {
        expect(fixture).toMatchSnapshot();
    });

    it("should have an invalid reset form when empty", () => {
        expect(component.resetForm.valid).toBeFalsy();
    });

    it("should have an invalid password field when being empty", () => {
        const password1Field = component.resetForm.controls["password1"];

        expect(password1Field.valid).toBeFalsy();
    });

    it("should have an required validator on the password field", () => {
        let errors = {};
        const password1Field = component.resetForm.controls["password1"];
        errors = password1Field.errors || {};

        expect(errors["required"]).toBeTruthy();
    });

    it("should have an invalid status with two different passwords", () => {
        const password1Field = component.resetForm.controls["password1"];
        const password2Field = component.resetForm.controls["password2"];
        password1Field.setValue("test");
        password2Field.setValue("testt");
        const errors = password2Field.errors || {};

        expect(errors["validatePasswordConfirm"]).toBeTruthy();
    });

    it("should emit the email when submitting the recovery form", () => {
        const password = "testtest";

        expect(component.resetForm.valid).toBeFalsy();

        component.resetForm.controls["password1"].setValue(password);
        component.resetForm.controls["password2"].setValue(password);

        expect(component.resetForm.valid).toBeTruthy();

        let passwordRequest: NewPasswordRequestDTO;
        component.reset.subscribe((value) => (passwordRequest = value));

        component.onReset();

        expect(passwordRequest!.password).toBe(password);
    });
});
