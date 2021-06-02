/// <reference types="Cypress" />

describe('Testing the Password Reset page', function () {

    beforeEach(function () {
        cy.fixture('ui-routes.json').as('paths');
        cy.fixture('api-routes.json').as('routes');
        cy.fixture('users.json').as('users');
        cy.fixture('toaster-messages.json').as('toaster');
        cy.fixture('success-responses.json').as('success');
        cy.fixture('error-responses.json').as('errors');
    });

    beforeEach(function () {
        cy.visit(this.paths.recovery);

        cy.get('input[name="email"]').as('emailInput');
        cy.get('button[type=submit]').as('recoverButton');
        cy.contains('a.mat-button', 'Cancel').as('cancelButton');

    });

    it('should display the Password Recovery page greeting', function () {
        cy.contains('mat-card-title', 'Recover Password');
        cy.get('form').within(() => {
            cy.contains('button', 'Recover password');
        });
    });

    it('should have a complete password recovery form', function () {
        cy.get('form').within(() => {
            cy.contains('Please enter the email address you used to register.');
            cy.get('@emailInput');
            cy.get('@recoverButton').should('be.disabled');
            cy.get('@cancelButton');
        });
    });

    describe('Testing the Password Reset page links', function () {
        it('should navigate back to the Login page', function () {
            cy.get('@cancelButton').click();
            cy.url().should('include', this.paths.login);
        });
    });

    describe('Testing the successful Password reset form submission', function () {

        it('should allow User1 to reset password', function () {
            cy.server();
            cy.route({
                method: 'PUT',
                url: this.routes.resetPasswordRequest,
                response: this.success[0].body,
                status: this.success[0].status

            });
            cy.get('@emailInput').type(this.users[0].email);
            cy.get('@recoverButton').click();
            cy.contains(this.toaster.registeredUserPasswordResetRequest1);
            cy.contains(this.toaster.passwordResetRequest2);
            cy.contains(this.toaster.passwordResetRequest3);
        });

    });

    describe('Testing Password Reset Page error states', function () {

        it('should require email', function () {
            cy.get('form').within(() => {
                cy.get('@emailInput').clear().blur();

                cy.contains('Email').should('have.css', 'color', 'rgb(254, 0, 0)');
                cy.get('mat-error')
                    .should('contain', 'You must enter a valid email')
                    .and('have.css', 'color', 'rgb(254, 0, 0)');
                cy.get('@recoverButton').should('be.disabled');
            });
        });

        it('should require valid email', function () {
            cy.get('form').within(() => {
                cy.get('@emailInput').clear().type('NonexistentUser').blur();

                cy.contains('Email').should('have.css', 'color', 'rgb(254, 0, 0)');
                cy.get('mat-error')
                    .should('contain', 'Not a valid email')
                    .and('have.css', 'color', 'rgb(254, 0, 0)');
                cy.get('@recoverButton').should('be.disabled');
            });
        });

        it('should show same toaster message for unregistered users', function () {
            cy.server();
            cy.route({
                method: 'PUT',
                url: this.routes.resetPasswordRequest,
                response: this.errors[0].body,
                status: this.errors[0].status
            }).as('recoveryRes');

            cy.get('@emailInput').type('NonexistentUser@none.com');
            cy.get('@recoverButton').click();
            cy.wait('@recoveryRes');
            cy.contains(this.toaster.unregisteredUserPasswordResetRequest1);
            cy.contains(this.toaster.passwordResetRequest2);
            cy.contains(this.toaster.passwordResetRequest3);
            cy.url().should('include', this.paths.login);
        });

    });

});
