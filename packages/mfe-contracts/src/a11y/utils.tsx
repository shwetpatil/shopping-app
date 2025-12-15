/**
 * Accessibility (a11y) Utilities
 * Helpers for building accessible React components
 */

import React, { useEffect, useRef } from 'react';

/**
 * Generate unique ID for accessibility attributes
 */
export function generateA11yId(prefix: string = 'a11y'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Hook to manage focus trap in modals/dialogs
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook to announce messages to screen readers
 */
export function useAnnouncer() {
  const announcerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create announcer element if it doesn't exist
    if (!announcerRef.current) {
      const announcer = document.createElement('div');
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.style.position = 'absolute';
      announcer.style.left = '-10000px';
      announcer.style.width = '1px';
      announcer.style.height = '1px';
      announcer.style.overflow = 'hidden';
      document.body.appendChild(announcer);
      announcerRef.current = announcer;
    }

    return () => {
      if (announcerRef.current) {
        document.body.removeChild(announcerRef.current);
        announcerRef.current = null;
      }
    };
  }, []);

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcerRef.current) {
      announcerRef.current.setAttribute('aria-live', priority);
      announcerRef.current.textContent = message;
    }
  };

  return announce;
}

/**
 * Hook to manage keyboard navigation
 */
export function useKeyboardNav(
  items: any[],
  onSelect: (item: any, index: number) => void,
  isActive: boolean = true
) {
  const currentIndexRef = useRef(0);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          currentIndexRef.current = Math.min(currentIndexRef.current + 1, items.length - 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          currentIndexRef.current = Math.max(currentIndexRef.current - 1, 0);
          break;
        case 'Home':
          e.preventDefault();
          currentIndexRef.current = 0;
          break;
        case 'End':
          e.preventDefault();
          currentIndexRef.current = items.length - 1;
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (items[currentIndexRef.current]) {
            onSelect(items[currentIndexRef.current], currentIndexRef.current);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [items, onSelect, isActive]);

  return currentIndexRef.current;
}

/**
 * Hook to restore focus when component unmounts
 */
export function useRestoreFocus() {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousActiveElement.current = document.activeElement as HTMLElement;

    return () => {
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, []);
}

/**
 * Get ARIA label for form input
 */
export function getAriaLabel(label: string, required: boolean = false, error?: string): string {
  let ariaLabel = label;
  if (required) ariaLabel += ' (required)';
  if (error) ariaLabel += `, error: ${error}`;
  return ariaLabel;
}

/**
 * Get ARIA attributes for form input
 */
export function getFormAriaProps(config: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  describedBy?: string;
}) {
  const { id, label, required = false, error, describedBy } = config;
  
  const props: Record<string, any> = {
    id,
    'aria-label': label,
    'aria-required': required,
  };

  if (error) {
    const errorId = `${id}-error`;
    props['aria-invalid'] = true;
    props['aria-describedby'] = describedBy ? `${errorId} ${describedBy}` : errorId;
  } else if (describedBy) {
    props['aria-describedby'] = describedBy;
  }

  return props;
}

/**
 * Get ARIA attributes for button
 */
export function getButtonAriaProps(config: {
  label: string;
  pressed?: boolean;
  expanded?: boolean;
  controls?: string;
  disabled?: boolean;
}) {
  const { label, pressed, expanded, controls, disabled = false } = config;
  
  const props: Record<string, any> = {
    'aria-label': label,
    'aria-disabled': disabled,
  };

  if (pressed !== undefined) {
    props['aria-pressed'] = pressed;
  }

  if (expanded !== undefined) {
    props['aria-expanded'] = expanded;
  }

  if (controls) {
    props['aria-controls'] = controls;
  }

  return props;
}

/**
 * Get ARIA attributes for loading state
 */
export function getLoadingAriaProps(isLoading: boolean, label: string = 'Loading') {
  return {
    'aria-busy': isLoading,
    'aria-live': 'polite' as const,
    'aria-label': isLoading ? label : undefined,
  };
}

/**
 * Skip to content link
 */
export function SkipToContent({ contentId = 'main-content' }: { contentId?: string }) {
  return (
    <a
      href={`#${contentId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
    >
      Skip to content
    </a>
  );
}

/**
 * Visually hidden text for screen readers
 */
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

/**
 * Check if element is visible
 */
export function isElementVisible(element: HTMLElement): boolean {
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    parseFloat(style.opacity) > 0
  );
}

/**
 * Get all focusable elements in container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const elements = Array.from(container.querySelectorAll<HTMLElement>(selector));
  return elements.filter(el => isElementVisible(el) && !el.hasAttribute('disabled'));
}
