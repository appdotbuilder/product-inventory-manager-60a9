
import { serial, text, pgTable, timestamp, numeric, integer, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  image_url: text('image_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

export const productVariationsTable = pgTable('product_variations', {
  id: serial('id').primaryKey(),
  product_id: integer('product_id').notNull().references(() => productsTable.id, { onDelete: 'cascade' }),
  variation_name: text('variation_name').notNull(),
  color: text('color'),
  size: text('size'),
  material: text('material'),
  unit_price: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  wholesale_price: numeric('wholesale_price', { precision: 10, scale: 2 }).notNull(),
  stock_quantity: integer('stock_quantity').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

export const productCategoriesTable = pgTable('product_categories', {
  product_id: integer('product_id').notNull().references(() => productsTable.id, { onDelete: 'cascade' }),
  category_id: integer('category_id').notNull().references(() => categoriesTable.id, { onDelete: 'cascade' })
}, (table) => ({
  pk: primaryKey({ columns: [table.product_id, table.category_id] })
}));

// Define relations
export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  productCategories: many(productCategoriesTable)
}));

export const productsRelations = relations(productsTable, ({ many }) => ({
  variations: many(productVariationsTable),
  productCategories: many(productCategoriesTable)
}));

export const productVariationsRelations = relations(productVariationsTable, ({ one }) => ({
  product: one(productsTable, {
    fields: [productVariationsTable.product_id],
    references: [productsTable.id]
  })
}));

export const productCategoriesRelations = relations(productCategoriesTable, ({ one }) => ({
  product: one(productsTable, {
    fields: [productCategoriesTable.product_id],
    references: [productsTable.id]
  }),
  category: one(categoriesTable, {
    fields: [productCategoriesTable.category_id],
    references: [categoriesTable.id]
  })
}));

// TypeScript types for tables
export type Category = typeof categoriesTable.$inferSelect;
export type NewCategory = typeof categoriesTable.$inferInsert;
export type Product = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;
export type ProductVariation = typeof productVariationsTable.$inferSelect;
export type NewProductVariation = typeof productVariationsTable.$inferInsert;
export type ProductCategory = typeof productCategoriesTable.$inferSelect;
export type NewProductCategory = typeof productCategoriesTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  categories: categoriesTable,
  products: productsTable,
  productVariations: productVariationsTable,
  productCategories: productCategoriesTable
};
