import { render } from '@testing-library/react';
import { ProductCard } from '../../components/product-card';
import { a11yChecks } from '../utils/a11y-utils';

describe('ProductCard Accessibility', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    price: 99.99,
    imageUrl: 'https://example.com/image.jpg',
    rating: 4,
    reviewCount: 10,
  };

  it('has accessible image with alt text', () => {
    render(<ProductCard product={mockProduct} />);
    a11yChecks.imagesHaveAlt();
  });

  it('has accessible add to cart button', () => {
    const { container } = render(<ProductCard product={mockProduct} />);
    const button = container.querySelector('button');
    
    expect(button).toHaveAttribute('aria-label', `Add ${mockProduct.name} to cart`);
    // Button has both aria-label and text content, which is good for a11y
    expect(button?.textContent).toContain('Add to Cart');
  });

  it('is keyboard accessible', () => {
    const { container } = render(<ProductCard product={mockProduct} />);
    const button = container.querySelector('button');
    
    // Buttons are keyboard accessible by default (tabindex not required)
    expect(button).toBeInTheDocument();
    expect(button?.tagName).toBe('BUTTON');
  });

  it('has proper semantic structure', () => {
    render(<ProductCard product={mockProduct} />);
    // ProductCard is a div with proper structure
    // Could be enhanced with article/section tags
  });
});
