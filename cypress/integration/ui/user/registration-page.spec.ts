/// <reference types="Cypress" />

describe('Testing the Registration Page', function () {
    beforeEach(function () {
        cy.fixture('ui-routes.json').as('paths');
    });

    beforeEach(function () {

        cy.visit(this.paths.register);

        cy.get('input[name="firstName"]').as('firstNameInput');
        cy.get('input[name="lastName"]').as('lastNameInput');
        cy.get('input[name="email"]').as('emailInput');
        cy.get('input[name="password1"]').as('passwordInput');
        cy.get('input[name="password2"]').as('confirmInput');
        cy.get('mat-checkbox[formcontrolname="dataProtection"]').as('dataProtectionCheckBox');
        cy.get('mat-checkbox[formcontrolname="newsletter"]').as('newsLetterCheckBox');
        cy.get('button[type=submit]').as('registerButton');
        cy.contains('a.mat-button', 'Cancel').as('cancelButton');
    });

    it('should display the registration page greeting', function () {
        cy.contains('mat-card-title', 'Registration');
        cy.get('form').within(() => {
            cy.contains('button', 'Submit');
            cy.get('@cancelButton');
        });
    });

    it('should have a complete registration form', function () {
        cy.get('form').within(() => {
            cy.get('@firstNameInput');
            cy.get('@lastNameInput');
            cy.get('@emailInput');
            cy.get('@passwordInput');
            cy.get('@confirmInput');
            cy.get('@dataProtectionCheckBox');
            cy.get('@newsLetterCheckBox');
            cy.get('@registerButton').should('be.disabled');
            cy.get('@cancelButton');
        });
    });

    it('should navigate back to the Login page', function () {
        cy.get('form').within(() => {
            cy.get('@cancelButton').click();
            cy.url().should('include', this.paths.login);
        });
    });

    describe('Testing the Registration Page error states', function () {

        // @ts-ignore
        const fillOutRegistrationForm = user => {
            cy.get('@firstNameInput').type(user.firstName);
            cy.get('@lastNameInput').type(user.lastName);
            cy.get('@emailInput').type(user.email);
            cy.get('@passwordInput').type(user.password);
            cy.get('@confirmInput').type(user.password);
            cy.get('@dataProtectionCheckBox').click();
        };

        beforeEach(function () {
            cy.fixture('users.json').as('users');
            cy.fixture('api-routes.json').as('routes');
            cy.fixture('error-responses.json').as('errors');
            cy.fixture('toaster-messages.json').as('toaster');

        });

        it('should require first name', function () {
            cy.get('form').within(() => {
                fillOutRegistrationForm(this.users[4]);
                cy.get('@firstNameInput').clear().blur();

                cy.contains('First Name').should('have.css', 'color', 'rgb(254, 0, 0)');
                cy.get('mat-error')
                    .should('contain', 'Required Field')
                    .and('have.css', 'color', 'rgb(254, 0, 0)');
                cy.get('@registerButton').should('be.disabled');
            });
        });

        it('should require last name', function () {
            cy.get('form').within(() => {
                fillOutRegistrationForm(this.users[4]);
                cy.get('@lastNameInput').clear().blur();

                cy.contains('Last Name').should('have.css', 'color', 'rgb(254, 0, 0)');
                cy.get('mat-error')
                    .should('contain', 'Required Field')
                    .and('have.css', 'color', 'rgb(254, 0, 0)');
                cy.get('@registerButton').should('be.disabled');
            });
        });

        it('should require email', function () {
            cy.get('form').within(() => {
                fillOutRegistrationForm(this.users[4]);
                cy.get('@emailInput').clear().blur();

                cy.contains('Email').should('have.css', 'color', 'rgb(254, 0, 0)');
                cy.get('mat-error')
                    .should('contain', 'You must enter a valid email')
                    .and('have.css', 'color', 'rgb(254, 0, 0)');
                cy.get('@registerButton').should('be.disabled');
            });
        });

        it('should require valid email', function () {
            cy.get('form').within(() => {
                fillOutRegistrationForm(this.users[4]);
                cy.get('@emailInput').clear().type('NonexistentUser').blur();

                cy.contains('Email').should('have.css', 'color', 'rgb(254, 0, 0)');
                cy.get('mat-error')
                    .should('contain', 'Not a valid email')
                    .and('have.css', 'color', 'rgb(254, 0, 0)');
                cy.get('@registerButton').should('be.disabled');
            });
        });

        it('should require password1', function () {
            cy.get('form').within(() => {
                fillOutRegistrationForm(this.users[4]);
                cy.get('@passwordInput').clear().blur();

                cy.contains('Password').should('have.css', 'color', 'rgb(254, 0, 0)');
                cy.get('mat-error')
                    .should('contain', 'Password is required')
                    .and('have.css', 'color', 'rgb(254, 0, 0)');
                cy.get('@registerButton').should('be.disabled');
            });
        });

        it('should require password confirmation', function () {
            cy.get('form').within(() => {
                fillOutRegistrationForm(this.users[4]);
                cy.get('@confirmInput').clear().blur();

                cy.contains('Confirm Password').should('have.css', 'color', 'rgb(254, 0, 0)');
                cy.get('mat-error')
                    .should('contain', 'Passwords must match')
                    .and('have.css', 'color', 'rgb(254, 0, 0)');
                cy.get('@registerButton').should('be.disabled');
            });
        });

        it('should require password1 & password2 to match', function () {
            cy.get('form').within(() => {
                fillOutRegistrationForm(this.users[4]);
                cy.get('@confirmInput').clear().type('nottherightpassword').blur();

                cy.contains('Confirm Password').should('have.css', 'color', 'rgb(254, 0, 0)');
                cy.get('mat-error')
                    .should('contain', 'Passwords must match')
                    .and('have.css', 'color', 'rgb(254, 0, 0)');
                cy.get('@registerButton').should('be.disabled');
            });
        });

        it('should prevent weak passwords', function () {
            cy.get('form').within(() => {
                fillOutRegistrationForm(this.users[5]);

                cy.contains('Password').should('have.css', 'color', 'rgb(254, 0, 0)');

                cy.get('mat-error')
                    .should('contain', 'Password is required')
                    .and('have.css', 'color', 'rgb(254, 0, 0)');

                cy.get('password-strength-meter')
                    .next()
                    .should('contain', 'Password to weak or to short')
                    .and('have.css', 'color', 'rgb(254, 0, 0)');

                cy.get('@registerButton').should('be.disabled');
            });
        });

        it('should require data protection consent', function () {
            cy.get('form').within(() => {
                fillOutRegistrationForm(this.users[5]);
                cy.get('@dataProtectionCheckBox').click();

                cy.get('mat-error')
                    .should('contain', 'You have to accept the Privacy Policy')
                    .and('have.css', 'color', 'rgb(254, 0, 0)');

                cy.get('@registerButton').should('be.disabled');
            });
        });

        it('should display toaster on 500', function () {
            cy.server();
            cy.route({
                method: 'POST',
                url: this.routes.registration,
                response: JSON.stringify(this.errors[0].body),
                status: this.errors[0].status

            }).as('registrationRes');

            fillOutRegistrationForm(this.users[4]);
            cy.get('@registerButton').click();
            cy.contains(this.toaster.registrationFailure1);
            cy.contains(this.toaster.registrationFailure2);
            cy.contains(this.toaster.registrationFailure3);
            cy.url().should('include', this.paths.login);
        });

        it('should display toaster for 400', function () {
            cy.server();
            cy.route({
                method: 'POST',
                url: this.routes.registration,
                response: JSON.stringify(this.errors[3].body),
                status: this.errors[3].status

            });

            fillOutRegistrationForm(this.users[4]);
            cy.get('@registerButton').click();
            cy.contains(this.toaster.registrationFailure1);
            cy.contains(this.toaster.registrationFailure2);
            cy.contains(this.toaster.registrationFailure3);
            cy.url().should('include', this.paths.register);
        });

    });
});
