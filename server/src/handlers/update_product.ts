
import { db } from '../db';
import { productsTable, productCategoriesTable, categoriesTable } from '../db/schema';
import { type UpdateProductInput, type ProductWithRelations } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateProduct(input: UpdateProductInput): Promise<ProductWithRelations> {
  try {
    // Check if product exists
    const existingProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.id))
      .execute();

    if (existingProduct.length === 0) {
      throw new Error(`Product with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.image_url !== undefined) updateData.image_url = input.image_url;
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update product if there are fields to update
    if (Object.keys(updateData).length > 1) { // More than just updated_at
      await db.update(productsTable)
        .set(updateData)
        .where(eq(productsTable.id, input.id))
        .execute();
    }

    // Handle category associations if provided
    if (input.category_ids !== undefined) {
      // Delete existing category associations
      await db.delete(productCategoriesTable)
        .where(eq(productCategoriesTable.product_id, input.id))
        .execute();

      // Insert new category associations
      if (input.category_ids.length > 0) {
        const categoryInserts = input.category_ids.map(categoryId => ({
          product_id: input.id,
          category_id: categoryId
        }));

        await db.insert(productCategoriesTable)
          .values(categoryInserts)
          .execute();
      }
    }

    // Fetch updated product with relations
    const updatedProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.id))
      .execute();

    // Fetch categories
    const productCategories = await db.select({
      category: categoriesTable
    })
      .from(productCategoriesTable)
      .innerJoin(categoriesTable, eq(productCategoriesTable.category_id, categoriesTable.id))
      .where(eq(productCategoriesTable.product_id, input.id))
      .execute();

    const categories = productCategories.map(pc => pc.category);

    return {
      ...updatedProduct[0],
      categories,
      variations: [] // Variations are not updated in this handler
    };
  } catch (error) {
    console.error('Product update failed:', error);
    throw error;
  }
}
