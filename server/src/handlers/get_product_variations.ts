
import { db } from '../db';
import { productVariationsTable } from '../db/schema';
import { type ProductVariation } from '../schema';
import { eq } from 'drizzle-orm';

export async function getProductVariations(productId: number): Promise<ProductVariation[]> {
  try {
    const result = await db.select()
      .from(productVariationsTable)
      .where(eq(productVariationsTable.product_id, productId))
      .execute();

    // Convert numeric fields back to numbers
    return result.map(variation => ({
      ...variation,
      unit_price: parseFloat(variation.unit_price),
      wholesale_price: parseFloat(variation.wholesale_price)
    }));
  } catch (error) {
    console.error('Get product variations failed:', error);
    throw error;
  }
}
