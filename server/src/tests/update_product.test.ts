
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, categoriesTable, productCategoriesTable } from '../db/schema';
import { type UpdateProductInput, type CreateProductInput, type CreateCategoryInput } from '../schema';
import { updateProduct } from '../handlers/update_product';
import { eq } from 'drizzle-orm';

describe('updateProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestProduct = async (): Promise<number> => {
    const result = await db.insert(productsTable)
      .values({
        name: 'Original Product',
        description: 'Original description',
        image_url: 'https://example.com/original.jpg'
      })
      .returning()
      .execute();
    return result[0].id;
  };

  const createTestCategory = async (name: string): Promise<number> => {
    const result = await db.insert(categoriesTable)
      .values({
        name,
        description: `${name} category`
      })
      .returning()
      .execute();
    return result[0].id;
  };

  it('should update product name', async () => {
    const productId = await createTestProduct();
    
    const updateInput: UpdateProductInput = {
      id: productId,
      name: 'Updated Product Name'
    };

    const result = await updateProduct(updateInput);

    expect(result.id).toEqual(productId);
    expect(result.name).toEqual('Updated Product Name');
    expect(result.description).toEqual('Original description');
    expect(result.image_url).toEqual('https://example.com/original.jpg');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update product description', async () => {
    const productId = await createTestProduct();
    
    const updateInput: UpdateProductInput = {
      id: productId,
      description: 'Updated description'
    };

    const result = await updateProduct(updateInput);

    expect(result.name).toEqual('Original Product');
    expect(result.description).toEqual('Updated description');
  });

  it('should update product image_url', async () => {
    const productId = await createTestProduct();
    
    const updateInput: UpdateProductInput = {
      id: productId,
      image_url: 'https://example.com/updated.jpg'
    };

    const result = await updateProduct(updateInput);

    expect(result.image_url).toEqual('https://example.com/updated.jpg');
  });

  it('should set image_url to null', async () => {
    const productId = await createTestProduct();
    
    const updateInput: UpdateProductInput = {
      id: productId,
      image_url: null
    };

    const result = await updateProduct(updateInput);

    expect(result.image_url).toBeNull();
  });

  it('should update multiple fields at once', async () => {
    const productId = await createTestProduct();
    
    const updateInput: UpdateProductInput = {
      id: productId,
      name: 'Multi Update Product',
      description: 'Multi update description',
      image_url: 'https://example.com/multi.jpg'
    };

    const result = await updateProduct(updateInput);

    expect(result.name).toEqual('Multi Update Product');
    expect(result.description).toEqual('Multi update description');
    expect(result.image_url).toEqual('https://example.com/multi.jpg');
  });

  it('should update category associations', async () => {
    const productId = await createTestProduct();
    const category1Id = await createTestCategory('Electronics');
    const category2Id = await createTestCategory('Gadgets');
    
    const updateInput: UpdateProductInput = {
      id: productId,
      category_ids: [category1Id, category2Id]
    };

    const result = await updateProduct(updateInput);

    expect(result.categories).toHaveLength(2);
    expect(result.categories?.map(c => c.name)).toContain('Electronics');
    expect(result.categories?.map(c => c.name)).toContain('Gadgets');
  });

  it('should replace existing category associations', async () => {
    const productId = await createTestProduct();
    const category1Id = await createTestCategory('Electronics');
    const category2Id = await createTestCategory('Gadgets');
    const category3Id = await createTestCategory('Tools');

    // First, add initial categories
    await db.insert(productCategoriesTable)
      .values([
        { product_id: productId, category_id: category1Id },
        { product_id: productId, category_id: category2Id }
      ])
      .execute();

    // Update with different categories
    const updateInput: UpdateProductInput = {
      id: productId,
      category_ids: [category3Id]
    };

    const result = await updateProduct(updateInput);

    expect(result.categories).toHaveLength(1);
    expect(result.categories?.[0].name).toEqual('Tools');
  });

  it('should remove all category associations when empty array provided', async () => {
    const productId = await createTestProduct();
    const categoryId = await createTestCategory('Electronics');

    // Add initial category
    await db.insert(productCategoriesTable)
      .values({ product_id: productId, category_id: categoryId })
      .execute();

    const updateInput: UpdateProductInput = {
      id: productId,
      category_ids: []
    };

    const result = await updateProduct(updateInput);

    expect(result.categories).toHaveLength(0);
  });

  it('should save changes to database', async () => {
    const productId = await createTestProduct();
    
    const updateInput: UpdateProductInput = {
      id: productId,
      name: 'DB Test Product'
    };

    await updateProduct(updateInput);

    const dbProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(dbProduct).toHaveLength(1);
    expect(dbProduct[0].name).toEqual('DB Test Product');
  });

  it('should throw error for non-existent product', async () => {
    const updateInput: UpdateProductInput = {
      id: 99999,
      name: 'Non-existent Product'
    };

    expect(updateProduct(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should return variations as empty array', async () => {
    const productId = await createTestProduct();
    
    const updateInput: UpdateProductInput = {
      id: productId,
      name: 'Test Variations'
    };

    const result = await updateProduct(updateInput);

    expect(result.variations).toEqual([]);
  });
});
