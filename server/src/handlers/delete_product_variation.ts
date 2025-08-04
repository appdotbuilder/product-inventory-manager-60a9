
import { db } from '../db';
import { productVariationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteProductVariation(id: number): Promise<void> {
  try {
    await db.delete(productVariationsTable)
      .where(eq(productVariationsTable.id, id))
      .execute();
  } catch (error) {
    console.error('Product variation deletion failed:', error);
    throw error;
  }
}
