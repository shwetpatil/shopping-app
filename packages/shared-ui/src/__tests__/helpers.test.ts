import {
  formatCurrency,
  formatDate,
  debounce,
  throttle,
  deepClone,
  groupBy,
  unique,
  truncate,
  isEmpty,
  clamp,
} from '../utils/helpers';

describe('Helper Utilities', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(29.99, 'USD')).toBe('$29.99');
      expect(formatCurrency(1000, 'USD')).toBe('$1,000.00');
      expect(formatCurrency(0, 'USD')).toBe('$0.00');
    });

    it('should handle different currencies', () => {
      expect(formatCurrency(100, 'EUR')).toContain('100');
      expect(formatCurrency(100, 'GBP')).toContain('100');
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2025-12-15T10:30:00Z');

    it('should format date in long format', () => {
      const result = formatDate(testDate, 'long');
      expect(result).toContain('2025');
      expect(result).toContain('Dec');
    });

    it('should format date in short format', () => {
      const result = formatDate(testDate, 'short');
      expect(result).toContain('2025');
    });

    it('should format relative time', () => {
      const result = formatDate(testDate, 'relative');
      expect(result).toBeDefined();
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    it('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    afterAll(() => {
      jest.useRealTimers();
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should throttle function calls', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);
      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('deepClone', () => {
    it('should clone objects deeply', () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = deepClone(obj);

      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
    });

    it('should clone arrays', () => {
      const arr = [1, 2, { a: 3 }];
      const cloned = deepClone(arr);

      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
    });
  });

  describe('groupBy', () => {
    it('should group array by key', () => {
      const items = [
        { category: 'A', value: 1 },
        { category: 'B', value: 2 },
        { category: 'A', value: 3 },
      ];

      const grouped = groupBy(items, 'category');

      expect(grouped.A).toHaveLength(2);
      expect(grouped.B).toHaveLength(1);
    });
  });

  describe('unique', () => {
    it('should remove duplicates from array', () => {
      const arr = [1, 2, 2, 3, 3, 3, 4];
      const result = unique(arr);

      expect(result).toEqual([1, 2, 3, 4]);
    });

    it('should remove duplicate objects by key', () => {
      const items = [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
        { id: 1, name: 'C' },
      ];

      const result = unique(items, 'id');
      expect(result).toHaveLength(2);
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...');
      expect(truncate('Short', 10)).toBe('Short');
    });

    it('should use custom suffix', () => {
      expect(truncate('Hello World', 5, '…')).toBe('Hello…');
    });
  });

  describe('isEmpty', () => {
    it('should detect empty values', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty('')).toBe(true);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);
    });

    it('should detect non-empty values', () => {
      expect(isEmpty('text')).toBe(false);
      expect(isEmpty([1])).toBe(false);
      expect(isEmpty({ a: 1 })).toBe(false);
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(false)).toBe(false);
    });
  });

  describe('clamp', () => {
    it('should clamp numbers to range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });
});
