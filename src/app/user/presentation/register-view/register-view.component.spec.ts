import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { RegisterViewComponent } from './register-view.component';
import { MaterialModule } from '../../../shared/material.module';
import { SharedModule } from '../../../shared/shared.module';
import { RouterTestingModule } from '@angular/router/testing';

describe('RegisterViewComponent', () => {

    let component: RegisterViewComponent;
    let fixture: ComponentFixture<RegisterViewComponent>;

    beforeEach(async(() => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        TestBed.configureTestingModule({
            declarations: [
                RegisterViewComponent
            ],
            imports: [
                MaterialModule,
                SharedModule,
                RouterTestingModule
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA]
        }).compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(RegisterViewComponent);
                component = fixture.componentInstance;

                component.ngOnInit();
            });
    }));

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should render the component correctly', () => {
        expect(fixture).toMatchSnapshot();
    });
});
