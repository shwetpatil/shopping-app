/**
 * ProductCard Component Tests
 */

import { render, screen, fireEvent } from '../utils/test-utils';
import { ProductCard } from '../../components/product-card';
import { mockProducts } from '../fixtures/products.fixture';

describe('ProductCard', () => {
  const mockProduct = mockProducts[0];
  const mockOnAddToCart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} onAddToCart={mockOnAddToCart} />);

    expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
    expect(screen.getByText(`$${mockProduct.price.toFixed(2)}`)).toBeInTheDocument();
    expect(screen.getByText(`(${mockProduct.reviewCount})`)).toBeInTheDocument();
  });

  it('renders product image with alt text', () => {
    render(<ProductCard product={mockProduct} />);

    const image = screen.getByAltText(mockProduct.name);
    expect(image).toBeInTheDocument();
    // Next.js Image component transforms the src URL
    expect(image).toHaveAttribute('alt', mockProduct.name);
    // Check that rating is displayed
    const rating = screen.getByText(`(${mockProduct.reviewCount})`);
    expect(rating).toBeInTheDocument();
  });

  it('calls onAddToCart with correct product ID when button clicked', () => {
    render(<ProductCard product={mockProduct} onAddToCart={mockOnAddToCart} />);

    const addToCartButton = screen.getByRole('button', { name: /add.*to cart/i });
    fireEvent.click(addToCartButton);

    expect(mockOnAddToCart).toHaveBeenCalledTimes(1);
    expect(mockOnAddToCart).toHaveBeenCalledWith(
      expect.any(Object), // MouseEvent
      mockProduct.id
    );
  });

  it('renders without rating when not provided', () => {
    const productWithoutRating = { ...mockProduct, rating: undefined, reviewCount: undefined };
    render(<ProductCard product={productWithoutRating} />);

    expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
    expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
  });

  it('shows fallback when image fails to load', () => {
    const productWithoutImage = { ...mockProduct, imageUrl: '' };
    render(<ProductCard product={productWithoutImage} />);

    expect(screen.getByText('No Image')).toBeInTheDocument();
  });

  it('has accessible button with aria-label', () => {
    render(<ProductCard product={mockProduct} onAddToCart={mockOnAddToCart} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', `Add ${mockProduct.name} to cart`);
  });
});
