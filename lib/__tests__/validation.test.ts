import '@testing-library/jest-dom';
import { ProductSchema } from '../schema';
import { sanitizeData } from '../supabase/client';

describe('Data Sanitization', () => {
  it('handles dates correctly', () => {
    const date = new Date('2023-09-01');
    const data = {
      created_at: date,
      nested: { date },
      array: [date]
    };

    const sanitized = sanitizeData(data);
    expect(sanitized.created_at).toBe(date.toISOString());
    expect(sanitized.nested.date).toBe(date.toISOString());
    expect(sanitized.array[0]).toBe(date.toISOString());
  });

  it('handles Supabase types with toJSON', () => {
    const data = {
      supabaseType: {
        toJSON: () => ({ id: '123', value: 'test' })
      }
    };

    const sanitized = sanitizeData(data);
    expect(sanitized.supabaseType).toEqual({ id: '123', value: 'test' });
  });

  it('handles null and undefined values', () => {
    const data = {
      nullValue: null,
      undefinedValue: undefined,
      nested: { nullValue: null }
    };

    const sanitized = sanitizeData(data);
    expect(sanitized.nullValue).toBeNull();
    expect(sanitized.undefinedValue).toBeUndefined();
    expect(sanitized.nested.nullValue).toBeNull();
  });
});

describe('Product Validation', () => {
  const validProduct = {
    id: '123',
    name: 'Test Product',
    brand: 'Test Brand',
    category: 'Test Category',
    price: 99.99,
    rating: 4.5,
    image_url: 'https://example.com/image.jpg',
    created_at: '2023-09-01T00:00:00.000Z',
    ranking: 1,
    description: 'Test Description',
    slug: 'test-product'
  };

  it('accepts valid product data', () => {
    const result = ProductSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it('handles optional fields', () => {
    const minimalProduct = {
      ...validProduct,
      rating: undefined,
      details: undefined,
      reviews: undefined
    };

    const result = ProductSchema.safeParse(minimalProduct);
    expect(result.success).toBe(true);
  });

  it('validates slug format', () => {
    const invalidSlug = {
      ...validProduct,
      slug: 'Invalid Slug!'
    };

    const result = ProductSchema.safeParse(invalidSlug);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Slug must be lowercase with hyphens');
    }
  });

  it('validates rating range', () => {
    const invalidRating = {
      ...validProduct,
      rating: 6
    };

    const result = ProductSchema.safeParse(invalidRating);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Rating must be between 0 and 5');
    }
  });

  it('validates image URL', () => {
    const invalidImageUrl = {
      ...validProduct,
      image_url: 'not-a-url'
    };

    const result = ProductSchema.safeParse(invalidImageUrl);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Invalid image URL');
    }
  });
}); 