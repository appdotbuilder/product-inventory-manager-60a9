
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { getCategories } from '../handlers/get_categories';

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getCategories();
    
    expect(result).toEqual([]);
  });

  it('should return all categories from database', async () => {
    // Create test categories
    await db.insert(categoriesTable)
      .values([
        {
          name: 'Electronics',
          description: 'Electronic devices and gadgets'
        },
        {
          name: 'Clothing',
          description: 'Apparel and fashion items'
        },
        {
          name: 'Books',
          description: null
        }
      ])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    
    // Verify all expected fields are present
    result.forEach(category => {
      expect(category.id).toBeDefined();
      expect(typeof category.id).toBe('number');
      expect(category.name).toBeDefined();
      expect(typeof category.name).toBe('string');
      expect(category.created_at).toBeInstanceOf(Date);
    });

    // Check specific category data
    const electronics = result.find(c => c.name === 'Electronics');
    expect(electronics).toBeDefined();
    expect(electronics!.description).toBe('Electronic devices and gadgets');

    const books = result.find(c => c.name === 'Books');
    expect(books).toBeDefined();
    expect(books!.description).toBeNull();
  });

  it('should return categories ordered by creation (database default)', async () => {
    // Create categories with slight delay to ensure different timestamps
    await db.insert(categoriesTable)
      .values({
        name: 'First Category',
        description: 'Created first'
      })
      .execute();

    await db.insert(categoriesTable)
      .values({
        name: 'Second Category', 
        description: 'Created second'
      })
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('First Category');
    expect(result[1].name).toBe('Second Category');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });

  it('should handle categories with various description values', async () => {
    await db.insert(categoriesTable)
      .values([
        {
          name: 'Category with description',
          description: 'This has a description'
        },
        {
          name: 'Category without description',
          description: null
        },
        {
          name: 'Category with empty description',
          description: ''
        }
      ])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    
    const withDesc = result.find(c => c.name === 'Category with description');
    expect(withDesc!.description).toBe('This has a description');

    const withoutDesc = result.find(c => c.name === 'Category without description');
    expect(withoutDesc!.description).toBeNull();

    const emptyDesc = result.find(c => c.name === 'Category with empty description');
    expect(emptyDesc!.description).toBe('');
  });
});
