/// <reference types="Cypress" />

describe('Testing the Footer', function () {
    beforeEach(function () {
        cy.visit('/');
        cy.get('fcl-page-footer').as('fclFooter');
    });

    describe('Testing the Footer content', function () {
        it('should display the date of last change and the client version', function () {
            cy.get('@fclFooter').within(function () {
                cy.get('fcl-last-change-display').within(function () {
                    cy.get('.fcl-item-change').as('changeItem');
                    cy.get('@changeItem')
                        .find('mat-icon')
                        .should('contain', 'update');
                    cy.get('@changeItem')
                        .should('contain', 'Last Change:')
                        .and('contain', 'client version@');
                });
            });
        });
    });

    describe('Testing the Footer links', function () {
        it('should open a new tab for the BfR page', function () {
            cy.get('@fclFooter')
                .find('mat-icon')
                .should('contain', 'public');
            cy.get('@fclFooter').within(() => {
                cy.contains('a', 'BfR - Bundesinstitut für Risikobewertung')
                    .should('have.attr', 'href', 'https://www.bfr.bund.de')
                    .and('have.attr', 'target', '_blank');
            });
        });

        it('should open a new tab for the FoodRisk - Labs page', function () {
            cy.get('@fclFooter')
                .find('mat-icon')
                .should('contain', 'public');
            cy.get('@fclFooter').within(() => {
                cy.contains('a', 'FoodRisk - Labs')
                    .should(
                        'have.attr',
                        'href',
                        'https://foodrisklabs.bfr.bund.de/foodrisk-labs/'
                    )
                    .and('have.attr', 'target', '_blank');
            });
        });

        it('should open a mail client for Probleme melden', function () {
            cy.get('@fclFooter')
                .find('mat-icon')
                .should('contain', 'mail');
            cy.get('@fclFooter').within(() => {
                cy.contains('a', 'Report a Problem')
                    .should(
                        'have.attr',
                        'href',
                        'mailto:foodrisklabs@bfr.bund.de'
                    );
            });
        });
    });
});
