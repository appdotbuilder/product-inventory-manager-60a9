
import { db } from '../db';
import { productVariationsTable } from '../db/schema';
import { type UpdateProductVariationInput, type ProductVariation } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProductVariation = async (input: UpdateProductVariationInput): Promise<ProductVariation> => {
  try {
    // Build update values object with only provided fields
    const updateValues: any = {};
    
    if (input.variation_name !== undefined) {
      updateValues.variation_name = input.variation_name;
    }
    
    if (input.color !== undefined) {
      updateValues.color = input.color;
    }
    
    if (input.size !== undefined) {
      updateValues.size = input.size;
    }
    
    if (input.material !== undefined) {
      updateValues.material = input.material;
    }
    
    if (input.unit_price !== undefined) {
      updateValues.unit_price = input.unit_price.toString();
    }
    
    if (input.wholesale_price !== undefined) {
      updateValues.wholesale_price = input.wholesale_price.toString();
    }
    
    if (input.stock_quantity !== undefined) {
      updateValues.stock_quantity = input.stock_quantity;
    }

    // Always update the updated_at timestamp
    updateValues.updated_at = new Date();

    // Update the product variation
    const result = await db.update(productVariationsTable)
      .set(updateValues)
      .where(eq(productVariationsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Product variation with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const variation = result[0];
    return {
      ...variation,
      unit_price: parseFloat(variation.unit_price),
      wholesale_price: parseFloat(variation.wholesale_price)
    };
  } catch (error) {
    console.error('Product variation update failed:', error);
    throw error;
  }
};
