
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, productVariationsTable, productCategoriesTable, categoriesTable } from '../db/schema';
import { deleteProduct } from '../handlers/delete_product';
import { eq } from 'drizzle-orm';

describe('deleteProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a product', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A product for testing deletion'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Verify product exists
    const productsBefore = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();
    expect(productsBefore).toHaveLength(1);

    // Delete the product
    await deleteProduct(productId);

    // Verify product is deleted
    const productsAfter = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();
    expect(productsAfter).toHaveLength(0);
  });

  it('should delete product variations when product is deleted (cascade)', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A product for testing deletion'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create test variation
    await db.insert(productVariationsTable)
      .values({
        product_id: productId,
        variation_name: 'Test Variation',
        unit_price: '19.99',
        wholesale_price: '15.99',
        stock_quantity: 100
      })
      .execute();

    // Verify variation exists
    const variationsBefore = await db.select()
      .from(productVariationsTable)
      .where(eq(productVariationsTable.product_id, productId))
      .execute();
    expect(variationsBefore).toHaveLength(1);

    // Delete the product
    await deleteProduct(productId);

    // Verify variations are deleted (cascade)
    const variationsAfter = await db.select()
      .from(productVariationsTable)
      .where(eq(productVariationsTable.product_id, productId))
      .execute();
    expect(variationsAfter).toHaveLength(0);
  });

  it('should delete product category associations when product is deleted (cascade)', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A product for testing deletion'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create product-category association
    await db.insert(productCategoriesTable)
      .values({
        product_id: productId,
        category_id: categoryId
      })
      .execute();

    // Verify association exists
    const associationsBefore = await db.select()
      .from(productCategoriesTable)
      .where(eq(productCategoriesTable.product_id, productId))
      .execute();
    expect(associationsBefore).toHaveLength(1);

    // Delete the product
    await deleteProduct(productId);

    // Verify associations are deleted (cascade)
    const associationsAfter = await db.select()
      .from(productCategoriesTable)
      .where(eq(productCategoriesTable.product_id, productId))
      .execute();
    expect(associationsAfter).toHaveLength(0);

    // Verify category still exists
    const categoriesAfter = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();
    expect(categoriesAfter).toHaveLength(1);
  });

  it('should handle deleting non-existent product gracefully', async () => {
    const nonExistentId = 99999;

    // Should not throw error when deleting non-existent product
    await expect(deleteProduct(nonExistentId)).resolves.toBeUndefined();
  });
});
