
import { db } from '../db';
import { productVariationsTable, productsTable } from '../db/schema';
import { type CreateProductVariationInput, type ProductVariation } from '../schema';
import { eq } from 'drizzle-orm';

export const createProductVariation = async (input: CreateProductVariationInput): Promise<ProductVariation> => {
  try {
    // Verify that the product exists first to prevent foreign key constraint violation
    const existingProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.product_id))
      .execute();

    if (existingProduct.length === 0) {
      throw new Error(`Product with id ${input.product_id} does not exist`);
    }

    // Insert product variation record
    const result = await db.insert(productVariationsTable)
      .values({
        product_id: input.product_id,
        variation_name: input.variation_name,
        color: input.color,
        size: input.size,
        material: input.material,
        unit_price: input.unit_price.toString(), // Convert number to string for numeric column
        wholesale_price: input.wholesale_price.toString(), // Convert number to string for numeric column
        stock_quantity: input.stock_quantity // Integer column - no conversion needed
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const variation = result[0];
    return {
      ...variation,
      unit_price: parseFloat(variation.unit_price), // Convert string back to number
      wholesale_price: parseFloat(variation.wholesale_price) // Convert string back to number
    };
  } catch (error) {
    console.error('Product variation creation failed:', error);
    throw error;
  }
};
