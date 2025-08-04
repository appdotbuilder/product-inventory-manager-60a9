
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { deleteCategory } from '../handlers/delete_category';
import { eq } from 'drizzle-orm';

const testCategory: CreateCategoryInput = {
  name: 'Test Category',
  description: 'A category for testing'
};

describe('deleteCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing category', async () => {
    // Create a category first
    const [createdCategory] = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    // Delete the category
    await deleteCategory(createdCategory.id);

    // Verify the category was deleted
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, createdCategory.id))
      .execute();

    expect(categories).toHaveLength(0);
  });

  it('should not throw error when deleting non-existent category', async () => {
    // Try to delete a category that doesn't exist - should complete without error
    await expect(async () => {
      await deleteCategory(999);
    }).not.toThrow();
  });

  it('should delete only the specified category', async () => {
    // Create multiple categories
    const [category1] = await db.insert(categoriesTable)
      .values({ name: 'Category 1', description: 'First category' })
      .returning()
      .execute();

    const [category2] = await db.insert(categoriesTable)
      .values({ name: 'Category 2', description: 'Second category' })
      .returning()
      .execute();

    // Delete only the first category
    await deleteCategory(category1.id);

    // Verify only the first category was deleted
    const remainingCategories = await db.select()
      .from(categoriesTable)
      .execute();

    expect(remainingCategories).toHaveLength(1);
    expect(remainingCategories[0].id).toEqual(category2.id);
    expect(remainingCategories[0].name).toEqual('Category 2');
  });
});
