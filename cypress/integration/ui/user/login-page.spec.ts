/// <reference types="Cypress" />

describe('Testing the Login Page', function () {
    beforeEach(function () {
        cy.fixture('ui-routes.json').as('paths');

        cy.visit('/');

        cy.get('input[name="email"]').as('emailInput');
        cy.get('input[name="password"]').as('passwordInput');
        cy.get('button[type=submit]').as('loginButton');
    });

    it('should forward to the login page when starting the app', function () {
        cy.url().should('contain', this.paths.login);
    });

    it('should display the login page greeting', function () {
        cy.contains('mat-card-title', 'Login');
        cy.get('form').within(() => {
            cy.contains('button', 'Login');
        });
    });

    it('should have a complete login form', function () {
        cy.get('form').within(() => {
            cy.get('@emailInput');
            cy.get('@passwordInput');
            cy.get('@loginButton').should('be.disabled');
        });
    });

    describe('Testing the Login page links', function () {

        it('should navigate to the "Register" dialog', function () {
            cy.get('fcl-mat-card-actions').within(() => {
                cy.get('button').contains('Register').click();
                cy.get('@paths').then(paths => {
                    cy.url().should('contain', this.paths.register);
                })
            });
        });

        it('should navigate to the "Password forgotten" dialog', function () {
            cy.get('fcl-mat-card-actions').within(() => {
                cy.get('button').contains('Password forgotten').click();
                cy.get('@paths').then(paths => {
                    cy.url().should('contain', this.paths.recovery);
                });
            });
        });
    });

    describe('Testing the Login page error states', function () {

        beforeEach(() => {
            cy.fixture('users.json').as('users');
            cy.fixture('api-routes.json').as('routes');
            cy.fixture('error-responses.json').as('errors');
            cy.fixture('toaster-messages.json').as('toaster');
        });

        it('should require email', function () {
            cy.get('form').within(() => {
                cy.get('@emailInput').focus();
                cy.get('@passwordInput').type(this.users[0].password);
                cy.contains('Email').should('have.css', 'color', 'rgb(254, 0, 0)');
                cy.get('mat-error')
                    .should('contain', 'You must enter a valid email')
                    .and('have.css', 'color', 'rgb(254, 0, 0)');
                cy.get('@loginButton').should('be.disabled');
            });
        });

        it('should require password', function () {
            cy.get('form').within(() => {
                cy.get('@passwordInput').focus();
                cy.get('@emailInput').type(this.users[0].email);
                cy.contains('Password').should('have.css', 'color', 'rgb(254, 0, 0)');
                cy.get('mat-error')
                    .should('contain', 'Password is required')
                    .and('have.css', 'color', 'rgb(254, 0, 0)');
                cy.get('@loginButton').should('be.disabled');
            });
        });

        it('should have valid email', function () {
            cy.get('@emailInput').type('wrongEmail');
            cy.get('@passwordInput').type('superSecret');
            cy.get('mat-error')
                .should('contain', 'Not a valid email')
                .and('have.css', 'color', 'rgb(254, 0, 0)');
            cy.get('@loginButton').should('be.disabled');
        });

        it('should display toaster on 500', function () {
            cy.server();
            cy.route({
                method: 'POST',
                url: this.routes.login,
                response: JSON.stringify(this.errors[0].body),
                status: this.errors[0].status

            }).as('loginRes');

            cy.get('@emailInput').type('NonexistentUser@none.com');
            cy.get('@passwordInput').type('NonexistentPassword');
            cy.get('@loginButton').click();

            cy.wait('@loginRes');

            cy.contains(this.toaster.loginErrorPart1);
            cy.contains(this.toaster.loginErrorPart2);
            cy.url().should('include', this.paths.login);
        });

        it('should display toaster for single failed attempts', function () {
            cy.server();
            cy.route({
                method: 'POST',
                url: this.routes.login,
                response: JSON.stringify(this.errors[1].body),
                status: this.errors[1].status

            }).as('loginRes');

            cy.get('@emailInput').type(this.users[0].email);
            cy.get('@passwordInput').type('wrongPassword');
            cy.get('@loginButton').click();

            cy.wait('@loginRes');

            cy.contains(this.toaster.loginErrorPart1);
            cy.contains(this.toaster.loginErrorPart2);
            cy.url().should('include', this.paths.login);
        });


    });

});
