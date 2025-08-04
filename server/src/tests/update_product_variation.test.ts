
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, productVariationsTable, categoriesTable, productCategoriesTable } from '../db/schema';
import { type UpdateProductVariationInput } from '../schema';
import { updateProductVariation } from '../handlers/update_product_variation';
import { eq } from 'drizzle-orm';

describe('updateProductVariation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a product variation', async () => {
    // Create a test product first
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A product for testing'
      })
      .returning()
      .execute();
    
    const productId = productResult[0].id;

    // Create a test product variation
    const variationResult = await db.insert(productVariationsTable)
      .values({
        product_id: productId,
        variation_name: 'Original Variation',
        color: 'Red',
        size: 'M',
        material: 'Cotton',
        unit_price: '19.99',
        wholesale_price: '14.99',
        stock_quantity: 100
      })
      .returning()
      .execute();

    const variationId = variationResult[0].id;

    // Update the variation
    const updateInput: UpdateProductVariationInput = {
      id: variationId,
      variation_name: 'Updated Variation',
      color: 'Blue',
      unit_price: 24.99,
      stock_quantity: 150
    };

    const result = await updateProductVariation(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(variationId);
    expect(result.variation_name).toEqual('Updated Variation');
    expect(result.color).toEqual('Blue');
    expect(result.unit_price).toEqual(24.99);
    expect(result.stock_quantity).toEqual(150);
    
    // Verify unchanged fields
    expect(result.size).toEqual('M');
    expect(result.material).toEqual('Cotton');
    expect(result.wholesale_price).toEqual(14.99);
    expect(result.product_id).toEqual(productId);
    
    // Verify updated_at changed
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated variation to database', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A product for testing'
      })
      .returning()
      .execute();
    
    const productId = productResult[0].id;

    // Create test variation
    const variationResult = await db.insert(productVariationsTable)
      .values({
        product_id: productId,
        variation_name: 'Original Variation',
        unit_price: '19.99',
        wholesale_price: '14.99',
        stock_quantity: 100
      })
      .returning()
      .execute();

    const variationId = variationResult[0].id;

    // Update the variation
    const updateInput: UpdateProductVariationInput = {
      id: variationId,
      variation_name: 'Database Test Variation',
      unit_price: 29.99
    };

    await updateProductVariation(updateInput);

    // Verify in database
    const variations = await db.select()
      .from(productVariationsTable)
      .where(eq(productVariationsTable.id, variationId))
      .execute();

    expect(variations).toHaveLength(1);
    expect(variations[0].variation_name).toEqual('Database Test Variation');
    expect(parseFloat(variations[0].unit_price)).toEqual(29.99);
    expect(variations[0].stock_quantity).toEqual(100); // Unchanged
  });

  it('should handle partial updates', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A product for testing'
      })
      .returning()
      .execute();
    
    const productId = productResult[0].id;

    // Create test variation
    const variationResult = await db.insert(productVariationsTable)
      .values({
        product_id: productId,
        variation_name: 'Original Variation',
        color: 'Red',
        size: 'L',
        unit_price: '19.99',
        wholesale_price: '14.99',
        stock_quantity: 100
      })
      .returning()
      .execute();

    const variationId = variationResult[0].id;

    // Update only one field
    const updateInput: UpdateProductVariationInput = {
      id: variationId,
      stock_quantity: 200
    };

    const result = await updateProductVariation(updateInput);

    // Verify only specified field changed
    expect(result.stock_quantity).toEqual(200);
    expect(result.variation_name).toEqual('Original Variation');
    expect(result.color).toEqual('Red');
    expect(result.size).toEqual('L');
    expect(result.unit_price).toEqual(19.99);
    expect(result.wholesale_price).toEqual(14.99);
  });

  it('should handle null values correctly', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A product for testing'
      })
      .returning()
      .execute();
    
    const productId = productResult[0].id;

    // Create test variation with some values
    const variationResult = await db.insert(productVariationsTable)
      .values({
        product_id: productId,
        variation_name: 'Test Variation',
        color: 'Blue',
        size: 'M',
        material: 'Cotton',
        unit_price: '19.99',
        wholesale_price: '14.99',
        stock_quantity: 100
      })
      .returning()
      .execute();

    const variationId = variationResult[0].id;

    // Update to set nullable fields to null
    const updateInput: UpdateProductVariationInput = {
      id: variationId,
      color: null,
      material: null
    };

    const result = await updateProductVariation(updateInput);

    // Verify null values were set
    expect(result.color).toBeNull();
    expect(result.material).toBeNull();
    expect(result.size).toEqual('M'); // Unchanged
    expect(result.variation_name).toEqual('Test Variation'); // Unchanged
  });

  it('should throw error for non-existent variation', async () => {
    const updateInput: UpdateProductVariationInput = {
      id: 99999,
      variation_name: 'This should fail'
    };

    expect(updateProductVariation(updateInput)).rejects.toThrow(/not found/i);
  });
});
