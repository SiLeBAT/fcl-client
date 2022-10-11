import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { ActivateViewComponent } from './activate-view.component';
import { MaterialModule } from '../../../shared/material.module';
import { SharedModule } from '../../../shared/shared.module';
import { RouterTestingModule } from '@angular/router/testing';

describe('ActivateViewComponent', () => {

    let component: ActivateViewComponent;
    let fixture: ComponentFixture<ActivateViewComponent>;

    beforeEach(async(() => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        TestBed.configureTestingModule({
            declarations: [
                ActivateViewComponent
            ],
            imports: [
                MaterialModule,
                SharedModule,
                RouterTestingModule
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA]
        }).compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(ActivateViewComponent);
                component = fixture.componentInstance;
            });
    }));

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should render the component correctly', () => {
        expect(fixture).toMatchSnapshot();
    });

});
