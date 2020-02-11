/// <reference types="Cypress" />

describe('Testing the Login Page', function () {
    beforeEach(() => {
        cy.fixture('ui-routes.json').as('paths').then(
            (paths) => {
                cy.visit(paths.login);
            }
        );
    });

    describe('Testing the Login page content', function () {
        it('should display the page greeting', function () {
            cy.contains('mat-card-title', 'Login');
            cy.get('form').within(() => {
                cy.contains('button', 'Anmelden');
                cy.get('[placeholder="E-Mail"]');
                cy.get('[placeholder="Passwort"]');
            });
        });
    });

    describe('Testing the Login page links', function () {
        it('should navigate to the Registration page', function () {
            cy.contains('Registrierung').click();
            cy.url().should('include', this.paths.register);
        });

        it('should navigate to the Passwort vergessen page', function () {
            cy.contains('Passwort vergessen?').click();
            cy.url().should('include', this.paths.recovery);
        });
    });

    describe('Testing Login Page error states', function () {
        beforeEach(() => {
            cy.fixture('users.json').as('users');
            cy.fixture('api-routes.json').as('routes');
            cy.fixture('error-responses.json').as('errors');
            cy.fixture('banner-messages.json').as('banner');
        });

        it('should require email', function () {
            cy.get('[name="email"]').focus();
            cy.get('[name="password"]').type(this.users[0].password);
            cy.contains('E-Mail').should('have.css', 'color', 'rgb(254, 0, 0)');
            cy.get('[type="submit"]').should('be.disabled');
        });

        it('should require valid email', function () {
            cy.get('[name="email"]').type('NonexistentUser');
            cy.get('[name="password"]').type('NonexistentPassword');
            cy.contains('E-Mail').should('have.css', 'color', 'rgb(254, 0, 0)');
            cy.get('[type="submit"]').should('be.disabled');
        });

        it('should require password', function () {
            cy.get('[name="email"]').type(this.users[0].email);
            cy.get('[name="password"]').focus().blur();
            cy.contains('Passwort').should('have.css', 'color', 'rgb(254, 0, 0)');
            cy.get('[type="submit"]').should('be.disabled');
        });

        it('should display banner on 500', function () {
            cy.server();
            cy.route({
                method: 'POST',
                url: this.routes.login,
                response: JSON.stringify(this.errors[0].body),
                status: this.errors[0].status

            }).as('login');

            cy.get('[name="email"]').type('NonexistentUser@none.com');
            cy.get('[name="password"]').type('NonexistentPassword');
            cy.get('[type="submit"]').click();
            cy.contains(this.banner.loginError);
            cy.url().should('include', this.paths.login);
        });

        it('should disable login for multiple failed attempts', function () {
            cy.server();
            cy.route({
                method: 'POST',
                url: this.routes.login,
                response: JSON.stringify(this.errors[2].body),
                status: this.errors[2].status

            }).as('login');
            cy.get('[name="email"]').type(this.users[0].email);
            cy.get('[name="password"]').type('wrongPassword');
            cy.get('[type="submit"]').click();
            cy.contains(this.banner.repeatedLoginError);
            cy.url().should('include', this.paths.login);
        });

        it('should display banner for single failed attempts', function () {
            cy.server();
            cy.route({
                method: 'POST',
                url: this.routes.login,
                response: JSON.stringify(this.errors[1].body),
                status: this.errors[1].status

            }).as('login');
            cy.get('[name="email"]').type(this.users[0].email);
            cy.get('[name="password"]').type('wrongPassword');
            cy.get('[type="submit"]').click();
            cy.contains(this.banner.loginError);
            cy.url().should('include', this.paths.login);
        });

    });

});
