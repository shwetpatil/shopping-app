/**
 * ProductGrid Component Tests
 */

import { render, screen, fireEvent } from '../utils/test-utils';
import { ProductGrid } from '../../components/product-grid';
import { mockProducts } from '../fixtures/products.fixture';

// Mock the contracts package
jest.mock('@shopping-app/mfe-contracts', () => ({
  useMFEPublish: () => jest.fn(),
}));

describe('ProductGrid', () => {
  const mockOnProductClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    const { container } = render(<ProductGrid loading={true} products={[]} />);

    // Should show skeleton loaders with animation
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state when no products', () => {
    render(<ProductGrid products={[]} loading={false} />);

    expect(screen.getByText('No products found')).toBeInTheDocument();
  });

  it('renders all products in grid', () => {
    render(<ProductGrid products={mockProducts} loading={false} />);

    mockProducts.forEach(product => {
      expect(screen.getByText(product.name)).toBeInTheDocument();
    });
  });

  it('limits displayed products when limit prop is provided', () => {
    render(<ProductGrid products={mockProducts} loading={false} limit={2} />);

    // Should only show first 2 products
    expect(screen.getByText(mockProducts[0].name)).toBeInTheDocument();
    expect(screen.getByText(mockProducts[1].name)).toBeInTheDocument();
    expect(screen.queryByText(mockProducts[2].name)).not.toBeInTheDocument();
  });

  it('calls onProductClick when product is clicked', () => {
    render(
      <ProductGrid 
        products={mockProducts} 
        loading={false}
        onProductClick={mockOnProductClick}
      />
    );

    const firstProduct = screen.getByText(mockProducts[0].name);
    fireEvent.click(firstProduct.closest('[role="button"]')!);

    expect(mockOnProductClick).toHaveBeenCalledWith(mockProducts[0]);
  });

  it('handles keyboard navigation with Enter key', () => {
    render(
      <ProductGrid 
        products={mockProducts} 
        loading={false}
        onProductClick={mockOnProductClick}
      />
    );

    const firstProduct = screen.getByText(mockProducts[0].name);
    const productButton = firstProduct.closest('[role="button"]')!;

    fireEvent.keyDown(productButton, { key: 'Enter' });

    expect(mockOnProductClick).toHaveBeenCalledWith(mockProducts[0]);
  });

  it('applies custom className', () => {
    const { container } = render(
      <ProductGrid 
        products={mockProducts} 
        loading={false}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has add to cart buttons for all products', () => {
    render(<ProductGrid products={mockProducts} loading={false} />);

    const addToCartButtons = screen.getAllByRole('button', { name: /add.*to cart/i });
    
    // Should have an add to cart button for each product
    expect(addToCartButtons.length).toBeGreaterThanOrEqual(mockProducts.length);
  });
});
