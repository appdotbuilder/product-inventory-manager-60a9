
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productVariationsTable, productsTable } from '../db/schema';
import { type CreateProductVariationInput } from '../schema';
import { createProductVariation } from '../handlers/create_product_variation';
import { eq } from 'drizzle-orm';

describe('createProductVariation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test product
  const createTestProduct = async () => {
    const result = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A product for testing',
        image_url: null
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should create a product variation', async () => {
    // Create prerequisite product first
    const product = await createTestProduct();

    const testInput: CreateProductVariationInput = {
      product_id: product.id,
      variation_name: 'Red Large Cotton',
      color: 'Red',
      size: 'Large',
      material: 'Cotton',
      unit_price: 29.99,
      wholesale_price: 19.99,
      stock_quantity: 50
    };

    const result = await createProductVariation(testInput);

    // Basic field validation
    expect(result.product_id).toEqual(product.id);
    expect(result.variation_name).toEqual('Red Large Cotton');
    expect(result.color).toEqual('Red');
    expect(result.size).toEqual('Large');
    expect(result.material).toEqual('Cotton');
    expect(result.unit_price).toEqual(29.99);
    expect(typeof result.unit_price).toBe('number');
    expect(result.wholesale_price).toEqual(19.99);
    expect(typeof result.wholesale_price).toBe('number');
    expect(result.stock_quantity).toEqual(50);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save product variation to database', async () => {
    // Create prerequisite product first
    const product = await createTestProduct();

    const testInput: CreateProductVariationInput = {
      product_id: product.id,
      variation_name: 'Blue Medium Silk',
      color: 'Blue',
      size: 'Medium',
      material: 'Silk',
      unit_price: 39.99,
      wholesale_price: 25.99,
      stock_quantity: 25
    };

    const result = await createProductVariation(testInput);

    // Query using proper drizzle syntax
    const variations = await db.select()
      .from(productVariationsTable)
      .where(eq(productVariationsTable.id, result.id))
      .execute();

    expect(variations).toHaveLength(1);
    expect(variations[0].product_id).toEqual(product.id);
    expect(variations[0].variation_name).toEqual('Blue Medium Silk');
    expect(variations[0].color).toEqual('Blue');
    expect(variations[0].size).toEqual('Medium');
    expect(variations[0].material).toEqual('Silk');
    expect(parseFloat(variations[0].unit_price)).toEqual(39.99);
    expect(parseFloat(variations[0].wholesale_price)).toEqual(25.99);
    expect(variations[0].stock_quantity).toEqual(25);
    expect(variations[0].created_at).toBeInstanceOf(Date);
    expect(variations[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle nullable fields correctly', async () => {
    // Create prerequisite product first
    const product = await createTestProduct();

    const testInput: CreateProductVariationInput = {
      product_id: product.id,
      variation_name: 'Basic Variation',
      color: null,
      size: null,
      material: null,
      unit_price: 15.99,
      wholesale_price: 10.99,
      stock_quantity: 100
    };

    const result = await createProductVariation(testInput);

    expect(result.variation_name).toEqual('Basic Variation');
    expect(result.color).toBeNull();
    expect(result.size).toBeNull();
    expect(result.material).toBeNull();
    expect(result.unit_price).toEqual(15.99);
    expect(result.wholesale_price).toEqual(10.99);
    expect(result.stock_quantity).toEqual(100);
  });

  it('should throw error when product does not exist', async () => {
    const testInput: CreateProductVariationInput = {
      product_id: 999999, // Non-existent product ID
      variation_name: 'Test Variation',
      color: 'Red',
      size: 'Large',
      material: 'Cotton',
      unit_price: 29.99,
      wholesale_price: 19.99,
      stock_quantity: 50
    };

    expect(createProductVariation(testInput)).rejects.toThrow(/product with id 999999 does not exist/i);
  });
});
