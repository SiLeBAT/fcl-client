import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DebugElement, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { ProfileComponent } from './profile.component';
import { MaterialModule } from '../../../shared/material.module';
import { SharedModule } from '../../../shared/shared.module';
import { TokenizedUser } from '../../models/user.model';
import { By } from '@angular/platform-browser';

describe('ProfileComponent', () => {

    let component: ProfileComponent;
    let fixture: ComponentFixture<ProfileComponent>;
    let debugElement: DebugElement;

    beforeEach(async(() => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        TestBed.configureTestingModule({
            declarations: [
                ProfileComponent
            ],
            imports: [
                MaterialModule,
                SharedModule,
                RouterTestingModule
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA]
        }).compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(ProfileComponent);
                component = fixture.componentInstance;
                debugElement = fixture.debugElement;
            });
    }));

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should render the component correctly', () => {
        expect(fixture).toMatchSnapshot();
    });

    it('should display the current user', () => {
        const currentUser: TokenizedUser = {
            email: 'email',
            firstName: 'first',
            lastName: 'last',
            token: 'test',
            gdprAgreementRequested: false
        };
        component.currentUser = currentUser;
        fixture.detectChanges();

        expect(fixture.nativeElement.outerHTML).toContain('first last');
        expect(fixture).toMatchSnapshot();
    });
});
