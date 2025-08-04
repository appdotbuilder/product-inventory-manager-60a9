
import { db } from '../db';
import { productsTable, productCategoriesTable, categoriesTable } from '../db/schema';
import { type CreateProductInput, type ProductWithRelations } from '../schema';
import { eq } from 'drizzle-orm';

export const createProduct = async (input: CreateProductInput): Promise<ProductWithRelations> => {
  try {
    // Insert product record
    const result = await db.insert(productsTable)
      .values({
        name: input.name,
        description: input.description,
        image_url: input.image_url
      })
      .returning()
      .execute();

    const product = result[0];

    // Handle category associations if provided
    if (input.category_ids && input.category_ids.length > 0) {
      // Verify all categories exist
      const existingCategories = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, input.category_ids[0])) // Start with first category
        .execute();

      // Check all categories exist
      for (const categoryId of input.category_ids) {
        const categoryExists = await db.select()
          .from(categoriesTable)
          .where(eq(categoriesTable.id, categoryId))
          .execute();
        
        if (categoryExists.length === 0) {
          throw new Error(`Category with id ${categoryId} does not exist`);
        }
      }

      // Insert product-category associations
      const categoryAssociations = input.category_ids.map(categoryId => ({
        product_id: product.id,
        category_id: categoryId
      }));

      await db.insert(productCategoriesTable)
        .values(categoryAssociations)
        .execute();

      // Fetch categories for the response
      const categories = await db.select()
        .from(categoriesTable)
        .execute();

      const productCategories = categories.filter(cat => 
        input.category_ids!.includes(cat.id)
      );

      return {
        ...product,
        categories: productCategories,
        variations: []
      };
    }

    // Return product without categories
    return {
      ...product,
      categories: [],
      variations: []
    };
  } catch (error) {
    console.error('Product creation failed:', error);
    throw error;
  }
};
