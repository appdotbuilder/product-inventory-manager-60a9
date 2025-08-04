
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, productVariationsTable, categoriesTable } from '../db/schema';
import { type CreateProductInput, type CreateProductVariationInput } from '../schema';
import { getProductVariations } from '../handlers/get_product_variations';

describe('getProductVariations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all variations for a specific product', async () => {
    // Create a test product first
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A product for testing',
        image_url: null
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create test variations
    const variation1 = {
      product_id: productId,
      variation_name: 'Small Red',
      color: 'Red',
      size: 'Small',
      material: 'Cotton',
      unit_price: '19.99',
      wholesale_price: '12.99',
      stock_quantity: 50
    };

    const variation2 = {
      product_id: productId,
      variation_name: 'Large Blue',
      color: 'Blue',
      size: 'Large',
      material: 'Polyester',
      unit_price: '29.99',
      wholesale_price: '19.99',
      stock_quantity: 30
    };

    await db.insert(productVariationsTable)
      .values([variation1, variation2])
      .execute();

    // Test the function
    const result = await getProductVariations(productId);

    expect(result).toHaveLength(2);
    
    // Verify numeric conversions
    expect(typeof result[0].unit_price).toBe('number');
    expect(typeof result[0].wholesale_price).toBe('number');
    expect(typeof result[1].unit_price).toBe('number');
    expect(typeof result[1].wholesale_price).toBe('number');

    // Find variations by name for consistent testing
    const smallRed = result.find(v => v.variation_name === 'Small Red');
    const largeBlue = result.find(v => v.variation_name === 'Large Blue');

    expect(smallRed).toBeDefined();
    expect(smallRed!.product_id).toEqual(productId);
    expect(smallRed!.color).toEqual('Red');
    expect(smallRed!.size).toEqual('Small');
    expect(smallRed!.material).toEqual('Cotton');
    expect(smallRed!.unit_price).toEqual(19.99);
    expect(smallRed!.wholesale_price).toEqual(12.99);
    expect(smallRed!.stock_quantity).toEqual(50);

    expect(largeBlue).toBeDefined();
    expect(largeBlue!.product_id).toEqual(productId);
    expect(largeBlue!.color).toEqual('Blue');
    expect(largeBlue!.size).toEqual('Large');
    expect(largeBlue!.material).toEqual('Polyester');
    expect(largeBlue!.unit_price).toEqual(29.99);
    expect(largeBlue!.wholesale_price).toEqual(19.99);
    expect(largeBlue!.stock_quantity).toEqual(30);
  });

  it('should return empty array for product with no variations', async () => {
    // Create a test product without variations
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Product Without Variations',
        description: 'A product with no variations',
        image_url: null
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    const result = await getProductVariations(productId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent product', async () => {
    const result = await getProductVariations(99999);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return variations for the specified product', async () => {
    // Create two test products
    const product1Result = await db.insert(productsTable)
      .values({
        name: 'Product 1',
        description: 'First product',
        image_url: null
      })
      .returning()
      .execute();

    const product2Result = await db.insert(productsTable)
      .values({
        name: 'Product 2',
        description: 'Second product',
        image_url: null
      })
      .returning()
      .execute();

    const product1Id = product1Result[0].id;
    const product2Id = product2Result[0].id;

    // Create variations for both products
    await db.insert(productVariationsTable)
      .values([
        {
          product_id: product1Id,
          variation_name: 'Product 1 Variation',
          color: 'Red',
          size: 'Medium',
          material: 'Cotton',
          unit_price: '15.99',
          wholesale_price: '10.99',
          stock_quantity: 25
        },
        {
          product_id: product2Id,
          variation_name: 'Product 2 Variation',
          color: 'Blue',
          size: 'Large',
          material: 'Silk',
          unit_price: '35.99',
          wholesale_price: '22.99',
          stock_quantity: 15
        }
      ])
      .execute();

    // Test that we only get variations for product 1
    const result = await getProductVariations(product1Id);

    expect(result).toHaveLength(1);
    expect(result[0].product_id).toEqual(product1Id);
    expect(result[0].variation_name).toEqual('Product 1 Variation');
    expect(result[0].color).toEqual('Red');
    expect(result[0].unit_price).toEqual(15.99);
  });
});
