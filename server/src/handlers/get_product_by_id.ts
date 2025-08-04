
import { db } from '../db';
import { 
  productsTable, 
  productVariationsTable, 
  productCategoriesTable, 
  categoriesTable 
} from '../db/schema';
import { type ProductWithRelations } from '../schema';
import { eq } from 'drizzle-orm';

export async function getProductById(id: number): Promise<ProductWithRelations | null> {
  try {
    // Get the product first
    const productResult = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, id))
      .execute();

    if (productResult.length === 0) {
      return null;
    }

    const product = productResult[0];

    // Get categories for this product
    const categoriesResult = await db.select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      description: categoriesTable.description,
      created_at: categoriesTable.created_at
    })
      .from(categoriesTable)
      .innerJoin(productCategoriesTable, eq(categoriesTable.id, productCategoriesTable.category_id))
      .where(eq(productCategoriesTable.product_id, id))
      .execute();

    // Get variations for this product
    const variationsResult = await db.select()
      .from(productVariationsTable)
      .where(eq(productVariationsTable.product_id, id))
      .execute();

    // Convert numeric fields in variations
    const variations = variationsResult.map(variation => ({
      ...variation,
      unit_price: parseFloat(variation.unit_price),
      wholesale_price: parseFloat(variation.wholesale_price)
    }));

    return {
      ...product,
      categories: categoriesResult,
      variations: variations
    };
  } catch (error) {
    console.error('Failed to get product by id:', error);
    throw error;
  }
}
