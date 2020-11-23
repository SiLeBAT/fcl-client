import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { AdminActivateComponent } from './admin-activate.component';
import { MaterialModule } from '../../../shared/material.module';
import { SharedModule } from '../../../shared/shared.module';
import { RouterTestingModule } from '@angular/router/testing';

describe('AdminActivateComponent', () => {

    let component: AdminActivateComponent;
    let fixture: ComponentFixture<AdminActivateComponent>;

    beforeEach(async(() => {
        // tslint:disable-next-line: no-floating-promises
        TestBed.configureTestingModule({
            declarations: [
                AdminActivateComponent
            ],
            imports: [
                MaterialModule,
                SharedModule,
                RouterTestingModule
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA]
        }).compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(AdminActivateComponent);
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

    it('should display the app name and name if admin token is valid', () => {
        const adminTokenValid: boolean = true;
        const appName = 'testApp';
        const name = 'testName';
        component.adminTokenValid = adminTokenValid;
        component.appName = appName;
        component.name = name;
        fixture.detectChanges();

        expect(fixture.nativeElement.outerHTML).toContain('testApp');
        expect(fixture.nativeElement.outerHTML).toContain('testName');
        expect(fixture).toMatchSnapshot();
    });

    it('should display admin activation failure if token is invalid', () => {
        const adminTokenValid: boolean = false;
        const appName = 'testApp';
        const name = 'testName';
        component.adminTokenValid = adminTokenValid;
        component.appName = appName;
        component.name = name;
        fixture.detectChanges();

        expect(fixture.nativeElement.outerHTML).toContain('Your admin activation failed');
        expect(fixture).toMatchSnapshot();
    });

});
