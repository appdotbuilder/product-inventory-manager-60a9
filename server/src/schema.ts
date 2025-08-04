
import { z } from 'zod';

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

// Product schema
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  image_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

// Product variation schema
export const productVariationSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  variation_name: z.string(),
  color: z.string().nullable(),
  size: z.string().nullable(),
  material: z.string().nullable(),
  unit_price: z.number(),
  wholesale_price: z.number(),
  stock_quantity: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ProductVariation = z.infer<typeof productVariationSchema>;

// Product category relation schema
export const productCategorySchema = z.object({
  product_id: z.number(),
  category_id: z.number()
});

export type ProductCategory = z.infer<typeof productCategorySchema>;

// Input schemas for creating
export const createCategoryInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable()
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

export const createProductInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  image_url: z.string().url().nullable(),
  category_ids: z.array(z.number()).optional()
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export const createProductVariationInputSchema = z.object({
  product_id: z.number(),
  variation_name: z.string().min(1),
  color: z.string().nullable(),
  size: z.string().nullable(),
  material: z.string().nullable(),
  unit_price: z.number().positive(),
  wholesale_price: z.number().positive(),
  stock_quantity: z.number().int().nonnegative()
});

export type CreateProductVariationInput = z.infer<typeof createProductVariationInputSchema>;

// Input schemas for updating
export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional()
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

export const updateProductInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  category_ids: z.array(z.number()).optional()
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

export const updateProductVariationInputSchema = z.object({
  id: z.number(),
  variation_name: z.string().min(1).optional(),
  color: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  material: z.string().nullable().optional(),
  unit_price: z.number().positive().optional(),
  wholesale_price: z.number().positive().optional(),
  stock_quantity: z.number().int().nonnegative().optional()
});

export type UpdateProductVariationInput = z.infer<typeof updateProductVariationInputSchema>;

// Product with relations schema
export const productWithRelationsSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  image_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  categories: z.array(categorySchema).optional(),
  variations: z.array(productVariationSchema).optional()
});

export type ProductWithRelations = z.infer<typeof productWithRelationsSchema>;
