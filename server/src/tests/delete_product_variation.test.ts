
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, productVariationsTable, categoriesTable } from '../db/schema';
import { deleteProductVariation } from '../handlers/delete_product_variation';
import { eq } from 'drizzle-orm';

describe('deleteProductVariation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a product variation', async () => {
    // Create a product first
    const [product] = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        image_url: null
      })
      .returning()
      .execute();

    // Create a product variation
    const [variation] = await db.insert(productVariationsTable)
      .values({
        product_id: product.id,
        variation_name: 'Test Variation',
        color: 'Red',
        size: 'M',
        material: 'Cotton',
        unit_price: '29.99',
        wholesale_price: '19.99',
        stock_quantity: 50
      })
      .returning()
      .execute();

    // Delete the variation
    await deleteProductVariation(variation.id);

    // Verify variation is deleted
    const variations = await db.select()
      .from(productVariationsTable)
      .where(eq(productVariationsTable.id, variation.id))
      .execute();

    expect(variations).toHaveLength(0);
  });

  it('should not affect other variations when deleting one', async () => {
    // Create a product
    const [product] = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        image_url: null
      })
      .returning()
      .execute();

    // Create two variations
    const [variation1] = await db.insert(productVariationsTable)
      .values({
        product_id: product.id,
        variation_name: 'Variation 1',
        color: 'Red',
        size: 'M',
        material: 'Cotton',
        unit_price: '29.99',
        wholesale_price: '19.99',
        stock_quantity: 50
      })
      .returning()
      .execute();

    const [variation2] = await db.insert(productVariationsTable)
      .values({
        product_id: product.id,
        variation_name: 'Variation 2',
        color: 'Blue',
        size: 'L',
        material: 'Polyester',
        unit_price: '34.99',
        wholesale_price: '24.99',
        stock_quantity: 30
      })
      .returning()
      .execute();

    // Delete the first variation
    await deleteProductVariation(variation1.id);

    // Verify first variation is deleted
    const deletedVariations = await db.select()
      .from(productVariationsTable)
      .where(eq(productVariationsTable.id, variation1.id))
      .execute();

    expect(deletedVariations).toHaveLength(0);

    // Verify second variation still exists
    const remainingVariations = await db.select()
      .from(productVariationsTable)
      .where(eq(productVariationsTable.id, variation2.id))
      .execute();

    expect(remainingVariations).toHaveLength(1);
    expect(remainingVariations[0].variation_name).toEqual('Variation 2');
  });

  it('should handle deleting non-existent variation gracefully', async () => {
    // Try to delete a variation that doesn't exist - should not throw
    let error;
    try {
      await deleteProductVariation(999);
    } catch (e) {
      error = e;
    }

    // Should complete without error
    expect(error).toBeUndefined();

    // Verify no variations exist in the database
    const allVariations = await db.select()
      .from(productVariationsTable)
      .execute();

    expect(allVariations).toHaveLength(0);
  });
});
