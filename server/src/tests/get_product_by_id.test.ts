
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  categoriesTable, 
  productsTable, 
  productVariationsTable, 
  productCategoriesTable 
} from '../db/schema';
import { getProductById } from '../handlers/get_product_by_id';

describe('getProductById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent product', async () => {
    const result = await getProductById(999);
    expect(result).toBeNull();
  });

  it('should return product without relations when no categories or variations exist', async () => {
    // Create a product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        image_url: 'https://example.com/image.jpg'
      })
      .returning()
      .execute();

    const product = productResult[0];
    const result = await getProductById(product.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(product.id);
    expect(result!.name).toEqual('Test Product');
    expect(result!.description).toEqual('A test product');
    expect(result!.image_url).toEqual('https://example.com/image.jpg');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.categories).toEqual([]);
    expect(result!.variations).toEqual([]);
  });

  it('should return product with categories and variations', async () => {
    // Create categories
    const categoryResult = await db.insert(categoriesTable)
      .values([
        { name: 'Electronics', description: 'Electronic items' },
        { name: 'Gadgets', description: 'Cool gadgets' }
      ])
      .returning()
      .execute();

    const [category1, category2] = categoryResult;

    // Create product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Smartphone',
        description: 'A smart phone',
        image_url: 'https://example.com/phone.jpg'
      })
      .returning()
      .execute();

    const product = productResult[0];

    // Link product to categories
    await db.insert(productCategoriesTable)
      .values([
        { product_id: product.id, category_id: category1.id },
        { product_id: product.id, category_id: category2.id }
      ])
      .execute();

    // Create variations
    await db.insert(productVariationsTable)
      .values([
        {
          product_id: product.id,
          variation_name: 'iPhone 13 Red 128GB',
          color: 'Red',
          size: '128GB',
          material: 'Aluminum',
          unit_price: '799.99',
          wholesale_price: '650.00',
          stock_quantity: 50
        },
        {
          product_id: product.id,
          variation_name: 'iPhone 13 Blue 256GB',
          color: 'Blue',
          size: '256GB',
          material: 'Aluminum',
          unit_price: '899.99',
          wholesale_price: '750.00',
          stock_quantity: 25
        }
      ])
      .execute();

    const result = await getProductById(product.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(product.id);
    expect(result!.name).toEqual('Smartphone');
    expect(result!.description).toEqual('A smart phone');
    expect(result!.image_url).toEqual('https://example.com/phone.jpg');

    // Check categories
    expect(result!.categories).toHaveLength(2);
    const categoryNames = result!.categories!.map(c => c.name).sort();
    expect(categoryNames).toEqual(['Electronics', 'Gadgets']);
    
    result!.categories!.forEach(category => {
      expect(category.id).toBeDefined();
      expect(category.created_at).toBeInstanceOf(Date);
    });

    // Check variations
    expect(result!.variations).toHaveLength(2);
    
    const redVariation = result!.variations!.find(v => v.color === 'Red');
    expect(redVariation).toBeDefined();
    expect(redVariation!.variation_name).toEqual('iPhone 13 Red 128GB');
    expect(redVariation!.size).toEqual('128GB');
    expect(redVariation!.material).toEqual('Aluminum');
    expect(redVariation!.unit_price).toEqual(799.99);
    expect(typeof redVariation!.unit_price).toEqual('number');
    expect(redVariation!.wholesale_price).toEqual(650.00);
    expect(typeof redVariation!.wholesale_price).toEqual('number');
    expect(redVariation!.stock_quantity).toEqual(50);
    expect(redVariation!.created_at).toBeInstanceOf(Date);
    expect(redVariation!.updated_at).toBeInstanceOf(Date);

    const blueVariation = result!.variations!.find(v => v.color === 'Blue');
    expect(blueVariation).toBeDefined();
    expect(blueVariation!.variation_name).toEqual('iPhone 13 Blue 256GB');
    expect(blueVariation!.unit_price).toEqual(899.99);
    expect(blueVariation!.wholesale_price).toEqual(750.00);
    expect(blueVariation!.stock_quantity).toEqual(25);
  });

  it('should return product with only categories when no variations exist', async () => {
    // Create a category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Books',
        description: 'Reading materials'
      })
      .returning()
      .execute();

    const category = categoryResult[0];

    // Create product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Book',
        description: 'A test book',
        image_url: null
      })
      .returning()
      .execute();

    const product = productResult[0];

    // Link product to category
    await db.insert(productCategoriesTable)
      .values({
        product_id: product.id,
        category_id: category.id
      })
      .execute();

    const result = await getProductById(product.id);

    expect(result).not.toBeNull();
    expect(result!.categories).toHaveLength(1);
    expect(result!.categories![0].name).toEqual('Books');
    expect(result!.variations).toEqual([]);
  });

  it('should return product with only variations when no categories exist', async () => {
    // Create product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Generic Product',
        description: 'A generic product',
        image_url: null
      })
      .returning()
      .execute();

    const product = productResult[0];

    // Create variation
    await db.insert(productVariationsTable)
      .values({
        product_id: product.id,
        variation_name: 'Standard Version',
        color: null,
        size: null,
        material: null,
        unit_price: '99.99',
        wholesale_price: '80.00',
        stock_quantity: 100
      })
      .execute();

    const result = await getProductById(product.id);

    expect(result).not.toBeNull();
    expect(result!.categories).toEqual([]);
    expect(result!.variations).toHaveLength(1);
    expect(result!.variations![0].variation_name).toEqual('Standard Version');
    expect(result!.variations![0].unit_price).toEqual(99.99);
    expect(result!.variations![0].wholesale_price).toEqual(80.00);
  });
});
