describe('Critical user paths', () => {
  const timestamp = Date.now();
  const email = `cypress+${timestamp}@example.com`;
  const password = Cypress.env('E2E_TEST_PASSWORD') || 'dummy-e2e-test-password-123!';
  const invalidPassword = 'dummy-e2e-wrong-password-123!';
  const placeTitle = `Cypress Place ${timestamp}`;

  function login() {
    cy.visit('/login');
    cy.get('[data-cy="login-email"]').clear().type(email);
    cy.get('[data-cy="login-password"]').clear().type(password);
    cy.get('[data-cy="login-submit"]').click();
    cy.url().should('eq', `${Cypress.config('baseUrl')}/`);
  }

  it('loads the landing page', () => {
    cy.visit('/');
    cy.contains('Travel Tracker').should('be.visible');
    cy.contains('Orte speichern').should('be.visible');
  });

  it('allows a new user to register and redirects to login', () => {
    cy.visit('/register');
    cy.get('[data-cy="register-email"]').type(email);
    cy.get('[data-cy="register-password"]').type(password);
    cy.get('[data-cy="register-submit"]').click();
    cy.url().should('include', '/login');
  });

  it('allows an existing user to login and reach the app root', () => {
    login();
    cy.get('[data-cy="app-root"]').should('exist');
  });

  it('shows an error when the password is invalid', () => {
    cy.visit('/login');
    cy.get('[data-cy="login-email"]').type(email);
    cy.get('[data-cy="login-password"]').type(invalidPassword);
    cy.get('[data-cy="login-submit"]').click();
    cy.get('[data-cy="error-message"]').should('contain.text', 'E-Mail oder Passwort ungültig.');
  });

  it('creates, displays, and deletes a place', () => {
    login();

    cy.get('[data-cy="add-place"]').click();
    cy.get('[data-cy="map"] .leaflet-container', { timeout: 10000 }).click(320, 220, { force: true });
    cy.get('[data-cy="place-form"]').should('be.visible');
    cy.get('[data-cy="place-title"]').type(placeTitle);
    cy.get('[data-cy="place-description"]').type('Created by Cypress');
    cy.get('[data-cy="place-submit"]').click();

    cy.contains('[data-cy="place-card"]', placeTitle).click();
    cy.contains(placeTitle).should('be.visible');

    cy.on('window:confirm', () => true);
    cy.get('[data-cy="delete-place"]').click();
    cy.contains('[data-cy="place-card"]', placeTitle).should('not.exist');
  });

  it('opens the profile panel and logs out', () => {
    login();
    cy.get('[data-cy="open-profile"]').click();
    cy.contains('Konto und Einstellungen').should('be.visible');

    cy.get('[data-cy="logout"]').click();
    cy.url().should('include', '/login');
    cy.visit('/');
    cy.url().should('include', '/login');
  });
});
