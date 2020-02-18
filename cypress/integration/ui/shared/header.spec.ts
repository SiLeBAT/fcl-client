/// <reference types="Cypress" />

describe('Testing the Header of the app', function () {

    beforeEach(function () {
        cy.fixture('ui-routes.json').as('paths');
        cy.fixture('users.json').as('users');

        cy.visit('/');
        cy.get('fcl-page-header').as('fclHeader');
    });

    it('should have the correct page title', function () {
        cy.title().should('contain', 'FoodChain-Lab');
    });

    describe('Testing the header links for an anonymous user', function () {

        it('should have the menu buttons for an anonymous user', function () {
            cy.get('@fclHeader').within(function () {
                cy.get('.fcl-toolbar-title')
                    .should('contain', 'FoodChain-Lab')
                    .and('have.class', 'no-hover');
                cy.get('.fcl-avatar-item')
                    .should('contain', 'Login/Register');
                cy.contains('mat-icon', 'exit_to_app');
            });
        });
    });

    describe('Testing the header links for an authenticated user', function () {

        beforeEach(function () {
            cy.login(this.users[0]);
        });

        it('should have the menu buttons on the dashboard', function () {
            const user = this.users[0];

            cy.visit(this.paths.dashboard);

            cy.get('@fclHeader').within(function () {
                cy.get('.fcl-toolbar-title')
                    .should('contain', 'FoodChain-Lab')
                    .and('have.class', 'no-hover');
                cy.get('.fcl-avatar-item').within(function () {
                    cy.get('mat-menu')
                    cy.get('button').should('have.class', 'mat-icon-button');
                    cy.contains('mat-icon', 'account_circle');
                    cy.get('button').click();
                });
            });
            cy.get('.mat-menu-content')
                .should('contain', `${user.firstName} ${user.lastName}`)
                .and('contain', `${user.email}`)
                .and('contain', 'Profile')
                .and('contain', 'Logout');
        });

        describe('Testing the header links on the tracing view', function () {

            this.beforeEach(function () {
                cy.visit(this.paths.tracing);
            })

            it('should have the hamburger menu', function () {
                cy.get('@fclHeader').within(function () {
                    cy.get('.fcl-toolbar-menu-container > .fcl-toolbar-menu-bottom').click();
                });
                cy.get('.fcl-left-sidenav').should('contain', 'Graph Settings');
            });

            it('should have a link to the dashboard', function () {
                cy.get('@fclHeader').within(function () {
                    cy.contains('.fcl-toolbar-title', 'FoodChain-Lab').click();
                    cy.url().should('contain', this.paths.dashboard);
                });
            });

            it('should have a link to load the example data', function () {
                cy.get('@fclHeader').within(function () {
                    cy.get('.fcl-action-container').within(function () {
                        cy.get('[data-cy=fcl-example]').as('exampleButton');
                        cy.get('@exampleButton').should('contain', 'Load Example Data');
                        cy.get('@exampleButton').should('have.attr', 'mattooltip', 'Load Example Data');
                        cy.get('@exampleButton').find('mat-icon').should('contain', 'wb_sunny');
                        cy.get('@exampleButton').click();
                    });
                });
                cy.get('.fcl-graph-legend > .fcl-legend');
            });

            it('should have a link to save the graph image', function () {
                cy.get('@fclHeader').within(function () {
                    cy.get('.fcl-action-container').within(function () {
                        cy.get('[mattooltip="Save image"]').as('saveImageButton');
                        cy.get('@saveImageButton').should('contain', 'Save Image');
                        cy.get('@saveImageButton').find('mat-icon').should('contain', 'image');
                    });
                });
            });

            it('should have a link to upload data', function () {
                cy.get('@fclHeader').within(function () {
                    cy.get('.fcl-action-container').within(function () {
                        cy.get('[mattooltip="Upload data"]').as('uploadDataButton');
                        cy.get('@uploadDataButton').should('contain', 'Upload Data');
                        cy.get('@uploadDataButton').find('mat-icon').should('contain', 'file_upload');
                    });
                });
            });

            it('should have a link to download data', function () {
                cy.get('@fclHeader').within(function () {
                    cy.get('.fcl-action-container').within(function () {
                        cy.get('[mattooltip="Download data"]').as('downloadDataButton');
                        cy.get('@downloadDataButton').should('contain', 'Download Data');
                        cy.get('@downloadDataButton').find('mat-icon').should('contain', 'file_download');
                    });
                });
            });

            it('should have a link to generate the ROA layout', function () {
                cy.get('@fclHeader').within(function () {
                    cy.get('.fcl-action-container').within(function () {
                        cy.get('[data-cy=fcl-example]').click();

                        cy.get('[mattooltip="Generate ROA Layout"]').as('roaButton');
                        cy.get('@roaButton').should('contain', 'ROA Style');
                        cy.get('@roaButton').find('mat-icon').should('contain', 'grid_on');
                        cy.get('@roaButton').click();
                        cy.url().should('contain', this.paths.roa);
                    });
                });
            });

            it('should have the avatar', function () {
                const user = this.users[0];

                cy.get('@fclHeader').within(function () {
                    cy.get('.fcl-avatar-item').within(function () {
                        cy.get('mat-menu')
                        cy.get('button').should('have.class', 'mat-icon-button');
                        cy.contains('mat-icon', 'account_circle');
                        cy.get('button').click();
                    });
                });
                cy.get('.mat-menu-content')
                    .should('contain', `${user.firstName} ${user.lastName}`)
                    .and('contain', `${user.email}`)
                    .and('contain', 'Profile')
                    .and('contain', 'Logout');
            });
        });

        describe('Testing the header links on the ROA style page', function () {

            beforeEach(function () {
                cy.login(this.users[0]);
                cy.visit(this.paths.roa);
            });

            it('should have a link to the dashboard', function () {
                cy.get('@fclHeader').within(function () {
                    cy.contains('.fcl-toolbar-title', 'FoodChain-Lab').click();
                    cy.url().should('contain', this.paths.dashboard);
                });
            });

            it('should have a link to the tracing view', function () {
                cy.get('@fclHeader').within(function () {
                    cy.get('.fcl-action-container').within(function () {
                        cy.get('[mattooltip="Tracing view"]').as('tracingViewButton');
                        cy.get('@tracingViewButton').should('contain', 'Tracing View');
                        cy.get('@tracingViewButton').find('mat-icon').should('contain', 'track_changes');
                        cy.get('@tracingViewButton').click();
                        cy.url().should('contain', this.paths.tracing);
                    });
                });
            });

        });

    });
});
