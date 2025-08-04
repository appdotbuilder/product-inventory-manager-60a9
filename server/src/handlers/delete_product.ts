
import { db } from '../db';
import { productsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteProduct(id: number): Promise<void> {
  try {
    // Delete the product - cascade delete will handle related records
    await db.delete(productsTable)
      .where(eq(productsTable.id, id))
      .execute();
  } catch (error) {
    console.error('Product deletion failed:', error);
    throw error;
  }
}
