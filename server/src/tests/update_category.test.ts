
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type UpdateCategoryInput, type CreateCategoryInput } from '../schema';
import { updateCategory } from '../handlers/update_category';
import { eq } from 'drizzle-orm';

// Test inputs
const createTestCategory: CreateCategoryInput = {
  name: 'Original Category',
  description: 'Original description'
};

const updateTestInput: UpdateCategoryInput = {
  id: 1, // Will be replaced with actual ID
  name: 'Updated Category',
  description: 'Updated description'
};

describe('updateCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update category name and description', async () => {
    // Create initial category
    const created = await db.insert(categoriesTable)
      .values(createTestCategory)
      .returning()
      .execute();

    const categoryId = created[0].id;

    // Update category
    const result = await updateCategory({
      id: categoryId,
      name: 'Updated Category',
      description: 'Updated description'
    });

    // Verify updated fields
    expect(result.id).toEqual(categoryId);
    expect(result.name).toEqual('Updated Category');
    expect(result.description).toEqual('Updated description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only name when description not provided', async () => {
    // Create initial category
    const created = await db.insert(categoriesTable)
      .values(createTestCategory)
      .returning()
      .execute();

    const categoryId = created[0].id;

    // Update only name
    const result = await updateCategory({
      id: categoryId,
      name: 'New Name Only'
    });

    // Verify only name changed
    expect(result.name).toEqual('New Name Only');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
  });

  it('should update only description when name not provided', async () => {
    // Create initial category
    const created = await db.insert(categoriesTable)
      .values(createTestCategory)
      .returning()
      .execute();

    const categoryId = created[0].id;

    // Update only description
    const result = await updateCategory({
      id: categoryId,
      description: 'New description only'
    });

    // Verify only description changed
    expect(result.name).toEqual('Original Category'); // Should remain unchanged
    expect(result.description).toEqual('New description only');
  });

  it('should set description to null when explicitly provided', async () => {
    // Create initial category
    const created = await db.insert(categoriesTable)
      .values(createTestCategory)
      .returning()
      .execute();

    const categoryId = created[0].id;

    // Update description to null
    const result = await updateCategory({
      id: categoryId,
      description: null
    });

    // Verify description is null
    expect(result.description).toBeNull();
    expect(result.name).toEqual('Original Category'); // Should remain unchanged
  });

  it('should persist changes to database', async () => {
    // Create initial category
    const created = await db.insert(categoriesTable)
      .values(createTestCategory)
      .returning()
      .execute();

    const categoryId = created[0].id;

    // Update category
    await updateCategory({
      id: categoryId,
      name: 'Persisted Update',
      description: 'Persisted description'
    });

    // Query database directly
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Persisted Update');
    expect(categories[0].description).toEqual('Persisted description');
  });

  it('should return existing category when no fields to update', async () => {
    // Create initial category
    const created = await db.insert(categoriesTable)
      .values(createTestCategory)
      .returning()
      .execute();

    const categoryId = created[0].id;

    // Update with no fields (empty object except id)
    const result = await updateCategory({
      id: categoryId
    });

    // Should return original data
    expect(result.name).toEqual('Original Category');
    expect(result.description).toEqual('Original description');
  });

  it('should throw error when category does not exist', async () => {
    const nonExistentId = 999;

    await expect(updateCategory({
      id: nonExistentId,
      name: 'This should fail'
    })).rejects.toThrow(/Category with id 999 not found/i);
  });
});
