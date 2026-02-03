/**
 * Accessibility Testing Utilities
 * Use these helpers to test ARIA labels, roles, and keyboard navigation
 */

/**
 * Test if element has proper ARIA label
 */
export function expectAccessibleName(element: HTMLElement, name: string) {
  expect(element).toHaveAttribute('aria-label', name);
}

/**
 * Test if element is keyboard accessible
 */
export function expectKeyboardAccessible(element: HTMLElement) {
  expect(element).toHaveAttribute('tabIndex');
  expect(parseInt(element.getAttribute('tabIndex') || '-1')).toBeGreaterThanOrEqual(0);
}

/**
 * Test if interactive element has role
 */
export function expectInteractiveRole(element: HTMLElement) {
  const role = element.getAttribute('role');
  const interactiveRoles = ['button', 'link', 'menuitem', 'tab', 'switch'];
  expect(interactiveRoles).toContain(role);
}

/**
 * Test semantic HTML usage
 */
export function expectSemanticHTML(queries: { queryByRole: (role: string) => HTMLElement | null }) {
  // Check for semantic landmarks
  const nav = queries.queryByRole('navigation');
  const main = queries.queryByRole('main');
  const article = queries.queryByRole('article');
  
  return {
    hasNav: nav !== null,
    hasMain: main !== null,
    hasArticle: article !== null,
  };
}

/**
 * Test keyboard navigation
 * @param element - Element to test
 * @param key - Key to press (e.g., 'Enter', 'Space', 'ArrowDown')
 */
export function simulateKeyPress(element: HTMLElement, key: string) {
  const event = new KeyboardEvent('keydown', {
    key,
    code: key,
    bubbles: true,
    cancelable: true,
  });
  element.dispatchEvent(event);
}

/**
 * Common accessibility issues to check
 */
export const a11yChecks = {
  // Images should have alt text
  imagesHaveAlt: () => {
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      expect(img).toHaveAttribute('alt');
    });
  },
  
  // Buttons should have accessible text
  buttonsHaveText: () => {
    const buttons = document.querySelectorAll('button');
    buttons.forEach((btn) => {
      const hasText = btn.textContent?.trim().length || 0 > 0;
      const hasAriaLabel = btn.hasAttribute('aria-label');
      expect(hasText || hasAriaLabel).toBe(true);
    });
  },
  
  // Interactive elements should be keyboard accessible
  interactiveElementsAccessible: () => {
    const interactive = document.querySelectorAll('[onclick], [role="button"], a[href]');
    interactive.forEach((el) => {
      const tabIndex = el.getAttribute('tabIndex');
      expect(tabIndex === null || parseInt(tabIndex) >= 0).toBe(true);
    });
  },
};
