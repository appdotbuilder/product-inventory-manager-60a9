
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, categoriesTable, productCategoriesTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

// Test inputs
const basicProductInput: CreateProductInput = {
  name: 'Test Product',
  description: 'A product for testing',
  image_url: 'https://example.com/image.jpg'
};

const productWithCategoriesInput: CreateProductInput = {
  name: 'Product with Categories',
  description: 'A product with category associations',
  image_url: 'https://example.com/product.jpg',
  category_ids: [1, 2]
};

describe('createProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a basic product without categories', async () => {
    const result = await createProduct(basicProductInput);

    expect(result.name).toEqual('Test Product');
    expect(result.description).toEqual('A product for testing');
    expect(result.image_url).toEqual('https://example.com/image.jpg');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.categories).toEqual([]);
    expect(result.variations).toEqual([]);
  });

  it('should save product to database', async () => {
    const result = await createProduct(basicProductInput);

    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].name).toEqual('Test Product');
    expect(products[0].description).toEqual('A product for testing');
    expect(products[0].image_url).toEqual('https://example.com/image.jpg');
    expect(products[0].created_at).toBeInstanceOf(Date);
    expect(products[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create product with category associations', async () => {
    // Create test categories first
    const categories = await db.insert(categoriesTable)
      .values([
        { name: 'Electronics', description: 'Electronic products' },
        { name: 'Gadgets', description: 'Tech gadgets' }
      ])
      .returning()
      .execute();

    const input = {
      ...productWithCategoriesInput,
      category_ids: [categories[0].id, categories[1].id]
    };

    const result = await createProduct(input);

    expect(result.name).toEqual('Product with Categories');
    expect(result.categories).toHaveLength(2);
    expect(result.categories!.map(c => c.name)).toContain('Electronics');
    expect(result.categories!.map(c => c.name)).toContain('Gadgets');
  });

  it('should save category associations to database', async () => {
    // Create test categories first
    const categories = await db.insert(categoriesTable)
      .values([
        { name: 'Electronics', description: 'Electronic products' },
        { name: 'Gadgets', description: 'Tech gadgets' }
      ])
      .returning()
      .execute();

    const input = {
      ...productWithCategoriesInput,
      category_ids: [categories[0].id, categories[1].id]
    };

    const result = await createProduct(input);

    // Check product-category associations in database
    const associations = await db.select()
      .from(productCategoriesTable)
      .where(eq(productCategoriesTable.product_id, result.id))
      .execute();

    expect(associations).toHaveLength(2);
    expect(associations.map(a => a.category_id)).toContain(categories[0].id);
    expect(associations.map(a => a.category_id)).toContain(categories[1].id);
  });

  it('should handle null description and image_url', async () => {
    const input: CreateProductInput = {
      name: 'Minimal Product',
      description: null,
      image_url: null
    };

    const result = await createProduct(input);

    expect(result.name).toEqual('Minimal Product');
    expect(result.description).toBeNull();
    expect(result.image_url).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should throw error when category does not exist', async () => {
    const input = {
      ...productWithCategoriesInput,
      category_ids: [999] // Non-existent category ID
    };

    await expect(createProduct(input)).rejects.toThrow(/Category with id 999 does not exist/i);
  });

  it('should handle empty category_ids array', async () => {
    const input = {
      ...basicProductInput,
      category_ids: []
    };

    const result = await createProduct(input);

    expect(result.categories).toEqual([]);
    expect(result.name).toEqual('Test Product');
  });
});
