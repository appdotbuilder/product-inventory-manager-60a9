
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, productsTable, productVariationsTable, productCategoriesTable } from '../db/schema';
import { getProducts } from '../handlers/get_products';

describe('getProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no products exist', async () => {
    const result = await getProducts();

    expect(result).toEqual([]);
  });

  it('should return products without relations', async () => {
    // Create a product without categories or variations
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        image_url: 'https://example.com/image.jpg'
      })
      .returning()
      .execute();

    const result = await getProducts();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(productResult[0].id);
    expect(result[0].name).toBe('Test Product');
    expect(result[0].description).toBe('A test product');
    expect(result[0].image_url).toBe('https://example.com/image.jpg');
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    expect(result[0].categories).toEqual([]);
    expect(result[0].variations).toEqual([]);
  });

  it('should return products with categories and variations', async () => {
    // Create category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic devices'
      })
      .returning()
      .execute();

    // Create product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Smartphone',
        description: 'A smart device',
        image_url: 'https://example.com/phone.jpg'
      })
      .returning()
      .execute();

    // Link product to category
    await db.insert(productCategoriesTable)
      .values({
        product_id: productResult[0].id,
        category_id: categoryResult[0].id
      })
      .execute();

    // Create product variation
    await db.insert(productVariationsTable)
      .values({
        product_id: productResult[0].id,
        variation_name: 'Black 128GB',
        color: 'Black',
        size: '128GB',
        material: 'Glass',
        unit_price: '699.99',
        wholesale_price: '500.00',
        stock_quantity: 50
      })
      .execute();

    const result = await getProducts();

    expect(result).toHaveLength(1);
    
    const product = result[0];
    expect(product.name).toBe('Smartphone');
    expect(product.description).toBe('A smart device');
    expect(product.image_url).toBe('https://example.com/phone.jpg');

    // Check categories
    expect(product.categories).toHaveLength(1);
    expect(product.categories![0].name).toBe('Electronics');
    expect(product.categories![0].description).toBe('Electronic devices');

    // Check variations
    expect(product.variations).toHaveLength(1);
    expect(product.variations![0].variation_name).toBe('Black 128GB');
    expect(product.variations![0].color).toBe('Black');
    expect(product.variations![0].size).toBe('128GB');
    expect(product.variations![0].material).toBe('Glass');
    expect(product.variations![0].unit_price).toBe(699.99);
    expect(product.variations![0].wholesale_price).toBe(500.00);
    expect(product.variations![0].stock_quantity).toBe(50);
    expect(typeof product.variations![0].unit_price).toBe('number');
    expect(typeof product.variations![0].wholesale_price).toBe('number');
  });

  it('should return multiple products with different relations', async () => {
    // Create categories
    const category1 = await db.insert(categoriesTable)
      .values({ name: 'Electronics', description: 'Electronic devices' })
      .returning()
      .execute();

    const category2 = await db.insert(categoriesTable)
      .values({ name: 'Accessories', description: 'Device accessories' })
      .returning()
      .execute();

    // Create products
    const product1 = await db.insert(productsTable)
      .values({ name: 'Smartphone', description: 'A smart device' })
      .returning()
      .execute();

    const product2 = await db.insert(productsTable)
      .values({ name: 'Phone Case', description: 'Protective case' })
      .returning()
      .execute();

    // Link products to categories
    await db.insert(productCategoriesTable)
      .values({ product_id: product1[0].id, category_id: category1[0].id })
      .execute();

    await db.insert(productCategoriesTable)
      .values({ product_id: product2[0].id, category_id: category2[0].id })
      .execute();

    // Create variations for first product only
    await db.insert(productVariationsTable)
      .values({
        product_id: product1[0].id,
        variation_name: 'Black Model',
        color: 'Black',
        unit_price: '699.99',
        wholesale_price: '500.00',
        stock_quantity: 25
      })
      .execute();

    const result = await getProducts();

    expect(result).toHaveLength(2);

    // Find products by name for consistent testing
    const smartphone = result.find(p => p.name === 'Smartphone');
    const phoneCase = result.find(p => p.name === 'Phone Case');

    expect(smartphone).toBeDefined();
    expect(smartphone!.categories).toHaveLength(1);
    expect(smartphone!.categories![0].name).toBe('Electronics');
    expect(smartphone!.variations).toHaveLength(1);
    expect(smartphone!.variations![0].color).toBe('Black');

    expect(phoneCase).toBeDefined();
    expect(phoneCase!.categories).toHaveLength(1);
    expect(phoneCase!.categories![0].name).toBe('Accessories');
    expect(phoneCase!.variations).toHaveLength(0);
  });
});
