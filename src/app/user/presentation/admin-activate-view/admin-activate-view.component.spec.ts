import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { AdminActivateViewComponent } from './admin-activate-view.component';
import { MaterialModule } from '../../../shared/material.module';
import { SharedModule } from '../../../shared/shared.module';
import { RouterTestingModule } from '@angular/router/testing';

describe('AdminActivateViewComponent', () => {

    let component: AdminActivateViewComponent;
    let fixture: ComponentFixture<AdminActivateViewComponent>;

    beforeEach(async(() => {
        // tslint:disable-next-line: no-floating-promises
        TestBed.configureTestingModule({
            declarations: [
                AdminActivateViewComponent
            ],
            imports: [
                MaterialModule,
                SharedModule,
                RouterTestingModule
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA]
        }).compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(AdminActivateViewComponent);
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
