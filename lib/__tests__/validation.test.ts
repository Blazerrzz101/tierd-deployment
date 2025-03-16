import '@testing-library/jest-dom';
import { z } from 'zod';
import { sanitizeData } from '@/lib/utils';
import { ProductSchema } from '@/lib/validation';

describe('Data Sanitization', () => {
  test('handles dates correctly', () => {
    const date = new Date();
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

  test('handles Supabase types with toJSON', () => {
    const data = {
      supabaseType: {
        id: '123',
        value: 'test',
        toJSON: () => ({ id: '123', value: 'test' })
      }
    };

    const sanitized = sanitizeData(data);
    expect(sanitized.supabaseType).toEqual({ id: '123', value: 'test' });
  });

  test('handles null and undefined values', () => {
    const data = {
      nullValue: null,
      undefinedValue: undefined,
      nested: {
        nullValue: null,
        undefinedValue: undefined
      }
    };

    const sanitized = sanitizeData(data);
    expect(sanitized.nullValue).toBeNull();
    expect(sanitized.undefinedValue).toBeUndefined();
    expect(sanitized.nested.nullValue).toBeNull();
    expect(sanitized.nested.undefinedValue).toBeUndefined();
  });
});

describe('Product Validation', () => {
  test('validates required fields', () => {
    const validProduct = {
      name: 'Test Product',
      description: 'A test product',
      url_slug: 'test-product',
      rating: 4.5,
      votes: 10
    };

    const result = ProductSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  test('validates slug format', () => {
    const invalidSlug = {
      name: 'Test Product',
      description: 'A test product',
      url_slug: 'TestProduct',
      rating: 4.5,
      votes: 10
    };

    const result = ProductSchema.safeParse(invalidSlug);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Slug must be lowercase with hyphens');
    }
  });

  test('validates rating range', () => {
    const invalidRating = {
      name: 'Test Product',
      description: 'A test product',
      url_slug: 'test-product',
      rating: 6,
      votes: 10
    };

    const result = ProductSchema.safeParse(invalidRating);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Rating must be between 0 and 5');
    }
  });
}); 