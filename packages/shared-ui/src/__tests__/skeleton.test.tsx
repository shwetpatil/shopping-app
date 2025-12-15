import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Skeleton,
  ProductCardSkeleton,
  ProductGridSkeleton,
  SearchBarSkeleton,
  CartSummarySkeleton,
  ReviewsListSkeleton,
  WishlistGridSkeleton,
  TableSkeleton,
} from '../components/Skeleton';

describe('Skeleton Components', () => {
  describe('Skeleton', () => {
    it('should render with default props', () => {
      render(<Skeleton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toBeDefined();
    });

    it('should apply text variant styles', () => {
      render(<Skeleton variant="text" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton.className).toContain('rounded');
    });

    it('should apply circular variant styles', () => {
      render(<Skeleton variant="circular" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton.className).toContain('rounded-full');
    });

    it('should apply rectangular variant styles', () => {
      render(<Skeleton variant="rectangular" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton.className).toContain('rounded-md');
    });

    it('should apply custom width and height', () => {
      render(<Skeleton width="200px" height="100px" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton.style.width).toBe('200px');
      expect(skeleton.style.height).toBe('100px');
    });

    it('should apply custom className', () => {
      render(<Skeleton className="custom-class" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton.className).toContain('custom-class');
    });
  });

  describe('ProductCardSkeleton', () => {
    it('should render product card skeleton structure', () => {
      render(<ProductCardSkeleton />);
      const container = screen.getAllByRole('status')[0];
      expect(container).toBeDefined();
    });
  });

  describe('ProductGridSkeleton', () => {
    it('should render default number of cards', () => {
      render(<ProductGridSkeleton />);
      const cards = screen.getAllByRole('status');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should render custom number of cards', () => {
      render(<ProductGridSkeleton count={3} />);
      const cards = screen.getAllByRole('status');
      expect(cards.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('SearchBarSkeleton', () => {
    it('should render search bar skeleton', () => {
      render(<SearchBarSkeleton />);
      const searchBar = screen.getAllByRole('status')[0];
      expect(searchBar).toBeDefined();
    });
  });

  describe('CartSummarySkeleton', () => {
    it('should render cart summary skeleton', () => {
      render(<CartSummarySkeleton />);
      const container = screen.getAllByRole('status')[0];
      expect(container).toBeDefined();
    });
  });

  describe('ReviewsListSkeleton', () => {
    it('should render default number of reviews', () => {
      render(<ReviewsListSkeleton />);
      const reviews = screen.getAllByRole('status');
      expect(reviews.length).toBeGreaterThan(0);
    });

    it('should render custom number of reviews', () => {
      render(<ReviewsListSkeleton count={2} />);
      const reviews = screen.getAllByRole('status');
      expect(reviews.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('WishlistGridSkeleton', () => {
    it('should render default number of items', () => {
      render(<WishlistGridSkeleton />);
      const items = screen.getAllByRole('status');
      expect(items.length).toBeGreaterThan(0);
    });

    it('should render custom number of items', () => {
      render(<WishlistGridSkeleton count={4} />);
      const items = screen.getAllByRole('status');
      expect(items.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('TableSkeleton', () => {
    it('should render with default rows and columns', () => {
      render(<TableSkeleton />);
      const table = screen.getAllByRole('status')[0];
      expect(table).toBeDefined();
    });

    it('should render custom number of rows', () => {
      render(<TableSkeleton rows={10} />);
      const table = screen.getAllByRole('status')[0];
      expect(table).toBeDefined();
    });

    it('should render custom number of columns', () => {
      render(<TableSkeleton columns={6} />);
      const table = screen.getAllByRole('status')[0];
      expect(table).toBeDefined();
    });
  });
});
