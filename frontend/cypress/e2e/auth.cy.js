describe('Auth flow', () => {
  const timestamp = Date.now();
  const email = `cypress+${timestamp}@example.com`;
  const password = Cypress.env('E2E_TEST_PASSWORD') || 'dummy-e2e-test-password-123!';
  const invalidPassword = 'dummy-e2e-wrong-password-123!';

  it('allows a new user to register and redirects to login', () => {
    cy.visit('/register');
    cy.get('[data-cy="register-email"]').type(email);
    cy.get('[data-cy="register-password"]').type(password);
    cy.get('[data-cy="register-submit"]').click();
    cy.url().should('include', '/login');
  });

  it('allows an existing user to login and reach the app root', () => {
    cy.visit('/login');
    cy.get('[data-cy="login-email"]').type(email);
    cy.get('[data-cy="login-password"]').type(password);
    cy.get('[data-cy="login-submit"]').click();
    cy.url().should('eq', `${Cypress.config('baseUrl')}/`);
    cy.get('[data-cy="app-root"]').should('exist');
  });

  it('shows an error when the password is invalid', () => {
    cy.visit('/login');
    cy.get('[data-cy="login-email"]').type(email);
    cy.get('[data-cy="login-password"]').type(invalidPassword);
    cy.get('[data-cy="login-submit"]').click();
    cy.get('[data-cy="error-message"]').should('contain.text', 'E-Mail oder Passwort ungültig.');
  });
});
