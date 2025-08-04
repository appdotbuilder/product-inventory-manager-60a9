
import { db } from '../db';
import { productsTable, categoriesTable, productVariationsTable, productCategoriesTable } from '../db/schema';
import { type ProductWithRelations } from '../schema';
import { eq } from 'drizzle-orm';

export async function getProducts(): Promise<ProductWithRelations[]> {
  try {
    // First, get all products
    const products = await db.select()
      .from(productsTable)
      .execute();

    // For each product, get its categories and variations
    const productsWithRelations: ProductWithRelations[] = [];

    for (const product of products) {
      // Get categories for this product
      const categories = await db.select({
        id: categoriesTable.id,
        name: categoriesTable.name,
        description: categoriesTable.description,
        created_at: categoriesTable.created_at
      })
        .from(categoriesTable)
        .innerJoin(productCategoriesTable, eq(categoriesTable.id, productCategoriesTable.category_id))
        .where(eq(productCategoriesTable.product_id, product.id))
        .execute();

      // Get variations for this product
      const variationsResult = await db.select()
        .from(productVariationsTable)
        .where(eq(productVariationsTable.product_id, product.id))
        .execute();

      // Convert numeric fields in variations
      const variations = variationsResult.map(variation => ({
        ...variation,
        unit_price: parseFloat(variation.unit_price),
        wholesale_price: parseFloat(variation.wholesale_price)
      }));

      productsWithRelations.push({
        ...product,
        categories,
        variations
      });
    }

    return productsWithRelations;
  } catch (error) {
    console.error('Failed to get products:', error);
    throw error;
  }
}
