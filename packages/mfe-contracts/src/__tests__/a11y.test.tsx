import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import {
  useFocusTrap,
  useAnnouncer,
  useKeyboardNav,
  useRestoreFocus,
  getFormAriaProps,
  getButtonAriaProps,
  getLoadingAriaProps,
  SkipToContent,
  VisuallyHidden,
  generateA11yId,
  isElementVisible,
  getFocusableElements,
} from '../a11y/utils';

describe('Accessibility Utilities', () => {
  describe('useFocusTrap', () => {
    it('should trap focus within container', () => {
      const { result } = renderHook(() => useFocusTrap());
      expect(result.current).toBeDefined();
    });

    it('should return ref for container', () => {
      const { result } = renderHook(() => useFocusTrap(true));
      expect(result.current.current).toBeDefined();
    });
  });

  describe('useAnnouncer', () => {
    it('should provide announce function', () => {
      const { result } = renderHook(() => useAnnouncer());
      expect(result.current).toBeDefined();
      expect(typeof result.current).toBe('function');
    });

    it('should announce messages', () => {
      const { result } = renderHook(() => useAnnouncer());
      
      act(() => {
        result.current('Test announcement');
      });

      // Check that announcement region exists
      const announcer = document.querySelector('[role="status"]');
      expect(announcer).toBeInTheDocument();
    });
  });

  describe('useKeyboardNav', () => {
    it('should handle arrow key navigation', () => {
      const items = ['item1', 'item2', 'item3'];
      const onSelect = jest.fn();

      const { result } = renderHook(() =>
        useKeyboardNav({ items, onSelect, orientation: 'vertical' })
      );

      expect(result.current.activeIndex).toBe(0);
    });

    it('should move to next item on ArrowDown', () => {
      const items = ['item1', 'item2', 'item3'];
      const { result } = renderHook(() =>
        useKeyboardNav({ items, orientation: 'vertical' })
      );

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
        result.current.handleKeyDown(event);
      });

      expect(result.current.activeIndex).toBe(1);
    });
  });

  describe('useRestoreFocus', () => {
    it('should restore focus on unmount', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();

      const { unmount } = renderHook(() => useRestoreFocus());
      
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      unmount();

      expect(document.activeElement).toBe(button);

      document.body.removeChild(button);
      document.body.removeChild(input);
    });
  });

  describe('getFormAriaProps', () => {
    it('should return ARIA props for valid form field', () => {
      const props = getFormAriaProps({
        id: 'email',
        label: 'Email',
        required: true,
        invalid: false,
      });

      expect(props.input['aria-required']).toBe(true);
      expect(props.input['aria-invalid']).toBe(false);
      expect(props.label.htmlFor).toBe('email');
    });

    it('should include error props when invalid', () => {
      const props = getFormAriaProps({
        id: 'email',
        label: 'Email',
        invalid: true,
        error: 'Invalid email',
      });

      expect(props.input['aria-invalid']).toBe(true);
      expect(props.input['aria-describedby']).toBe('email-error');
      expect(props.error?.id).toBe('email-error');
    });

    it('should include description props', () => {
      const props = getFormAriaProps({
        id: 'email',
        label: 'Email',
        description: 'Enter your email address',
      });

      expect(props.input['aria-describedby']).toContain('email-description');
      expect(props.description?.id).toBe('email-description');
    });
  });

  describe('getButtonAriaProps', () => {
    it('should return basic button ARIA props', () => {
      const props = getButtonAriaProps({
        label: 'Click me',
      });

      expect(props['aria-label']).toBe('Click me');
    });

    it('should include pressed state for toggle buttons', () => {
      const props = getButtonAriaProps({
        label: 'Toggle',
        pressed: true,
      });

      expect(props['aria-pressed']).toBe(true);
    });

    it('should include expanded state for expandable buttons', () => {
      const props = getButtonAriaProps({
        label: 'Expand',
        expanded: true,
        controls: 'panel-1',
      });

      expect(props['aria-expanded']).toBe(true);
      expect(props['aria-controls']).toBe('panel-1');
    });

    it('should include disabled state', () => {
      const props = getButtonAriaProps({
        label: 'Submit',
        disabled: true,
      });

      expect(props['aria-disabled']).toBe(true);
    });
  });

  describe('getLoadingAriaProps', () => {
    it('should return loading ARIA props', () => {
      const props = getLoadingAriaProps({ message: 'Loading data...' });

      expect(props.container['aria-live']).toBe('polite');
      expect(props.container['aria-busy']).toBe(true);
      expect(props.label['aria-label']).toBe('Loading data...');
    });

    it('should support assertive priority', () => {
      const props = getLoadingAriaProps({
        message: 'Critical loading',
        priority: 'assertive',
      });

      expect(props.container['aria-live']).toBe('assertive');
    });
  });

  describe('SkipToContent', () => {
    it('should render skip link', () => {
      render(<SkipToContent targetId="main-content" />);
      const link = screen.getByText(/skip to main content/i);
      expect(link).toBeInTheDocument();
    });

    it('should have correct href', () => {
      render(<SkipToContent targetId="main-content" />);
      const link = screen.getByText(/skip to main content/i);
      expect(link).toHaveAttribute('href', '#main-content');
    });
  });

  describe('VisuallyHidden', () => {
    it('should render children', () => {
      render(<VisuallyHidden>Hidden text</VisuallyHidden>);
      const element = screen.getByText('Hidden text');
      expect(element).toBeInTheDocument();
    });

    it('should apply visually hidden styles', () => {
      render(<VisuallyHidden>Hidden text</VisuallyHidden>);
      const element = screen.getByText('Hidden text');
      expect(element).toHaveStyle({
        position: 'absolute',
        width: '1px',
        height: '1px',
      });
    });
  });

  describe('generateA11yId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateA11yId('test');
      const id2 = generateA11yId('test');

      expect(id1).not.toBe(id2);
      expect(id1).toContain('test');
    });
  });

  describe('isElementVisible', () => {
    it('should detect visible elements', () => {
      const element = document.createElement('div');
      element.style.display = 'block';
      document.body.appendChild(element);

      expect(isElementVisible(element)).toBe(true);

      document.body.removeChild(element);
    });

    it('should detect hidden elements', () => {
      const element = document.createElement('div');
      element.style.display = 'none';
      document.body.appendChild(element);

      expect(isElementVisible(element)).toBe(false);

      document.body.removeChild(element);
    });
  });

  describe('getFocusableElements', () => {
    it('should find all focusable elements', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button>Button 1</button>
        <input type="text" />
        <a href="#">Link</a>
        <button>Button 2</button>
      `;
      document.body.appendChild(container);

      const focusable = getFocusableElements(container);
      expect(focusable).toHaveLength(4);

      document.body.removeChild(container);
    });

    it('should exclude disabled elements', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button>Enabled</button>
        <button disabled>Disabled</button>
      `;
      document.body.appendChild(container);

      const focusable = getFocusableElements(container);
      expect(focusable).toHaveLength(1);

      document.body.removeChild(container);
    });
  });
});
