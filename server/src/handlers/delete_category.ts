
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteCategory = async (id: number): Promise<void> => {
  try {
    await db.delete(categoriesTable)
      .where(eq(categoriesTable.id, id))
      .execute();
  } catch (error) {
    console.error('Category deletion failed:', error);
    throw error;
  }
};
