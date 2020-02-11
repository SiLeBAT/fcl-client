/// <reference types="Cypress" />

describe('Testing the Profile page', function () {

    beforeEach(() => {
        cy.fixture('ui-routes.json').as('paths');
        cy.fixture('users.json').as('users');
    });

    describe('Testing the Profile page for an anonymous user', function () {

        beforeEach(function () {
            cy.visit(this.paths.profile);
        });

        it('should redirect to the Login page', function () {
            cy.url().should('include', this.paths.root);
        });
    });

    describe('Testing the  Profile page for an authenticated user', function () {

        beforeEach(function () {
            cy.login(this.users[0]);
            cy.visit(this.paths.profile);
        });

        describe('Testing the Profile page content', function () {

            it('should display the Profile page greeting', function () {
                cy.get('mat-card-title').should('contain', 'User Profile');
            });

            it('should display the user information', function () {
                const user = this.users[0];
                cy.get('fcl-mat-card-body').as('cardBody');
                cy.get('@cardBody').should('contain', `${user.firstName} ${user.lastName}`);
                cy.get('@cardBody').should('contain', `${user.email}`);
            });
        });
    });

});
