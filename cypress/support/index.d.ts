/// <reference types="Cypress" />

import { Credentials } from './test.model';

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to log user into the front-end.
     * @example cy.login()
     */
      login(credentials: Credentials): Chainable<Element>;
  }
}
