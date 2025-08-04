
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import type { 
  ProductWithRelations, 
  Category, 
  ProductVariation,
  CreateProductInput, 
  CreateCategoryInput, 
  CreateProductVariationInput,
  UpdateProductInput,
  UpdateProductVariationInput 
} from '../../server/src/schema';

function App() {
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithRelations | null>(null);
  const [productVariations, setProductVariations] = useState<ProductVariation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [productForm, setProductForm] = useState<CreateProductInput>({
    name: '',
    description: null,
    image_url: null,
    category_ids: []
  });

  const [categoryForm, setCategoryForm] = useState<CreateCategoryInput>({
    name: '',
    description: null
  });

  const [variationForm, setVariationForm] = useState<CreateProductVariationInput>({
    product_id: 0,
    variation_name: '',
    color: null,
    size: null,
    material: null,
    unit_price: 0,
    wholesale_price: 0,
    stock_quantity: 0
  });

  const [editingProduct, setEditingProduct] = useState<ProductWithRelations | null>(null);
  const [editingVariation, setEditingVariation] = useState<ProductVariation | null>(null);

  // Dialogs state
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isVariationDialogOpen, setIsVariationDialogOpen] = useState(false);
  const [isEditProductDialogOpen, setIsEditProductDialogOpen] = useState(false);
  const [isEditVariationDialogOpen, setIsEditVariationDialogOpen] = useState(false);

  // Load data functions
  const loadProducts = useCallback(async () => {
    try {
      const result = await trpc.getProducts.query();
      setProducts(result);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const result = await trpc.getCategories.query();
      setCategories(result);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  const loadProductVariations = useCallback(async (productId: number) => {
    try {
      const result = await trpc.getProductVariations.query(productId);
      setProductVariations(result);
    } catch (error) {
      console.error('Failed to load product variations:', error);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  // Product handlers
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createProduct.mutate(productForm);
      setProducts((prev: ProductWithRelations[]) => [...prev, response]);
      setProductForm({
        name: '',
        description: null,
        image_url: null,
        category_ids: []
      });
      setIsProductDialogOpen(false);
    } catch (error) {
      console.error('Failed to create product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdateProductInput = {
        id: editingProduct.id,
        name: editingProduct.name,
        description: editingProduct.description,
        image_url: editingProduct.image_url,
        category_ids: editingProduct.categories?.map((cat: Category) => cat.id) || []
      };
      
      await trpc.updateProduct.mutate(updateData);
      await loadProducts();
      setEditingProduct(null);
      setIsEditProductDialogOpen(false);
    } catch (error) {
      console.error('Failed to update product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      await trpc.deleteProduct.mutate(productId);
      setProducts((prev: ProductWithRelations[]) => prev.filter((p: ProductWithRelations) => p.id !== productId));
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  // Category handlers
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createCategory.mutate(categoryForm);
      setCategories((prev: Category[]) => [...prev, response]);
      setCategoryForm({
        name: '',
        description: null
      });
      setIsCategoryDialogOpen(false);
    } catch (error) {
      console.error('Failed to create category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Variation handlers
  const handleCreateVariation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    setIsLoading(true);
    try {
      const variationData = {
        ...variationForm,
        product_id: selectedProduct.id
      };
      
      await trpc.createProductVariation.mutate(variationData);
      await loadProductVariations(selectedProduct.id);
      setVariationForm({
        product_id: 0,
        variation_name: '',
        color: null,
        size: null,
        material: null,
        unit_price: 0,
        wholesale_price: 0,
        stock_quantity: 0
      });
      setIsVariationDialogOpen(false);
    } catch (error) {
      console.error('Failed to create variation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateVariation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariation) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdateProductVariationInput = {
        id: editingVariation.id,
        variation_name: editingVariation.variation_name,
        color: editingVariation.color,
        size: editingVariation.size,
        material: editingVariation.material,
        unit_price: editingVariation.unit_price,
        wholesale_price: editingVariation.wholesale_price,
        stock_quantity: editingVariation.stock_quantity
      };
      
      await trpc.updateProductVariation.mutate(updateData);
      if (selectedProduct) {
        await loadProductVariations(selectedProduct.id);
      }
      setEditingVariation(null);
      setIsEditVariationDialogOpen(false);
    } catch (error) {
      console.error('Failed to update variation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVariation = async (variationId: number) => {
    try {
      await trpc.deleteProductVariation.mutate(variationId);
      if (selectedProduct) {
        await loadProductVariations(selectedProduct.id);
      }
    } catch (error) {
      console.error('Failed to delete variation:', error);
    }
  };

  const handleProductSelect = async (product: ProductWithRelations) => {
    setSelectedProduct(product);
    await loadProductVariations(product.id);
  };

  const handleCategoryToggle = (categoryId: number) => {
    setProductForm((prev: CreateProductInput) => {
      const currentIds = prev.category_ids || [];
      const newIds = currentIds.includes(categoryId)
        ? currentIds.filter((id: number) => id !== categoryId)
        : [...currentIds, categoryId];
      return { ...prev, category_ids: newIds };
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📦 Manajemen Inventori Produk</h1>
        <p className="text-gray-600">Kelola produk, variasi, dan kategori inventori Anda</p>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="products">Produk</TabsTrigger>
          <TabsTrigger value="categories">Kategori</TabsTrigger>
          <TabsTrigger value="variations">Variasi Produk</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Daftar Produk</h2>
            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  ➕ Tambah Produk
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Tambah Produk Baru</DialogTitle>
                  <DialogDescription>
                    Buat produk baru dengan informasi dasar dan kategori
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateProduct} className="space-y-4">
                  <div>
                    <Label htmlFor="product-name">Nama Produk</Label>
                    <Input
                      id="product-name"
                      value={productForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProductForm((prev: CreateProductInput) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Contoh: Kaos Polo"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="product-description">Deskripsi</Label>
                    <Textarea
                      id="product-description"
                      value={productForm.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setProductForm((prev: CreateProductInput) => ({ 
                          ...prev, 
                          description: e.target.value || null 
                        }))
                      }
                      placeholder="Deskripsi produk..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="product-image">URL Foto Produk</Label>
                    <Input
                      id="product-image"
                      type="url"
                      value={productForm.image_url || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProductForm((prev: CreateProductInput) => ({ 
                          ...prev, 
                          image_url: e.target.value || null 
                        }))
                      }
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div>
                    <Label>Kategori</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {categories.map((category: Category) => (
                        <div key={category.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`category-${category.id}`}
                            checked={productForm.category_ids?.includes(category.id) || false}
                            onChange={() => handleCategoryToggle(category.id)}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor={`category-${category.id}`} className="text-sm">
                            {category.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isLoading ? 'Menyimpan...' : 'Simpan Produk'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {products.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-4xl mb-4">📦</div>
                <p className="text-gray-500 mb-4">Belum ada produk. Tambahkan produk pertama Anda!</p>
                <Button 
                  onClick={() => setIsProductDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Tambah Produk Pertama
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product: ProductWithRelations) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    {product.image_url && (
                      <div className="w-full h-48 bg-gray-100 rounded-md mb-4 overflow-hidden">
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    {product.description && (
                      <CardDescription>{product.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {product.categories && product.categories.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Kategori:</p>
                          <div className="flex flex-wrap gap-1">
                            {product.categories.map((category: Category) => (
                              <Badge key={category.id} variant="secondary" className="text-xs">
                                {category.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Dibuat: {product.created_at.toLocaleDateString('id-ID')}</span>
                        <span>{product.variations?.length || 0} variasi</span>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleProductSelect(product)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          📋 Kelola Variasi
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingProduct(product);
                            setIsEditProductDialogOpen(true);
                          }}
                        >
                          ✏️
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">🗑️</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Produk</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus produk "{product.name}"? 
                                Tindakan ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteProduct(product.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Kategori Produk</h2>
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  🏷️ Tambah Kategori
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Tambah Kategori Baru</DialogTitle>
                  <DialogDescription>
                    Buat kategori untuk mengelompokkan produk
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateCategory} className="space-y-4">
                  <div>
                    <Label htmlFor="category-name">Nama Kategori</Label>
                    <Input
                      id="category-name"
                      value={categoryForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCategoryForm((prev: CreateCategoryInput) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Contoh: Pakaian"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category-description">Deskripsi</Label>
                    <Textarea
                      id="category-description"
                      value={categoryForm.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setCategoryForm((prev: CreateCategoryInput) => ({ 
                          ...prev, 
                          description: e.target.value || null 
                        }))
                      }
                      placeholder="Deskripsi kategori..."
                      rows={3}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isLoading ? 'Menyimpan...' : 'Simpan Kategori'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {categories.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-4xl mb-4">🏷️</div>
                <p className="text-gray-500 mb-4">Belum ada kategori. Tambahkan kategori untuk mengelompokkan produk!</p>
                <Button 
                  onClick={() => setIsCategoryDialogOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Tambah Kategori Pertama
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category: Category) => (
                <Card key={category.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      🏷️ {category.name}
                    </CardTitle>
                    {category.description && (
                      <CardDescription>{category.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      Dibuat: {category.created_at.toLocaleDateString('id-ID')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Product Variations Tab */}
        <TabsContent value="variations" className="space-y-6">
          {!selectedProduct ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-4xl mb-4">🎨</div>
                <p className="text-gray-500 mb-4">Pilih produk dari tab "Produk" untuk mengelola variasinya</p>
                <p className="text-sm text-gray-400">Variasi meliputi warna, ukuran, bahan, harga, dan stok</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-semibold">Variasi: {selectedProduct.name}</h2>
                  <p className="text-gray-600">Kelola variasi produk dengan harga dan stok masing-masing</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedProduct(null)}
                  >
                    ← Kembali
                  </Button>
                  <Dialog open={isVariationDialogOpen} onOpenChange={setIsVariationDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700">
                        🎨 Tambah Variasi
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Tambah Variasi Produk</DialogTitle>
                        <DialogDescription>
                          Tambah variasi untuk {selectedProduct.name}
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateVariation} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="variation-name">Nama Variasi</Label>
                            <Input
                              id="variation-name"
                              value={variationForm.variation_name}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setVariationForm((prev: CreateProductVariationInput) => ({ 
                                  ...prev, 
                                  variation_name: e.target.value 
                                }))
                              }
                              placeholder="Contoh: Merah Ukuran L"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="variation-color">Warna</Label>
                            <Input
                              id="variation-color"
                              value={variationForm.color || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setVariationForm((prev: CreateProductVariationInput) => ({ 
                                  ...prev, 
                                  color: e.target.value || null 
                                }))
                              }
                              placeholder="Contoh: Merah"
                            />
                          </div>
                          <div>
                            <Label htmlFor="variation-size">Ukuran</Label>
                            <Input
                              id="variation-size"
                              value={variationForm.size || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setVariationForm((prev: CreateProductVariationInput) => ({ 
                                  ...prev, 
                                  size: e.target.value || null 
                                }))
                              }
                              placeholder="Contoh: L, XL, 42"
                            />
                          </div>
                          <div>
                            <Label htmlFor="variation-material">Bahan</Label>
                            <Input
                              id="variation-material"
                              value={variationForm.material || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setVariationForm((prev: CreateProductVariationInput) => ({ 
                                  ...prev, 
                                  material: e.target.value || null 
                                }))
                              }
                              placeholder="Contoh: Katun"
                            />
                          </div>
                          <div>
                            <Label htmlFor="variation-unit-price">Harga Satuan (Rp)</Label>
                            <Input
                              id="variation-unit-price"
                              type="number"
                              value={variationForm.unit_price}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setVariationForm((prev: CreateProductVariationInput) => ({ 
                                  ...prev, 
                                  unit_price: parseFloat(e.target.value) || 0 
                                }))
                              }
                              min="0"
                              step="0.01"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="variation-wholesale-price">Harga Grosir (Rp)</Label>
                            <Input
                              id="variation-wholesale-price"
                              type="number"
                              value={variationForm.wholesale_price}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setVariationForm((prev: CreateProductVariationInput) => ({ 
                                  ...prev, 
                                  wholesale_price: parseFloat(e.target.value) || 0 
                                }))
                              }
                              min="0"
                              step="0.01"
                              required
                            />
                          </div>
                          <div className="col-span-2">
                            <Label htmlFor="variation-stock">Jumlah Stok</Label>
                            <Input
                              id="variation-stock"
                              type="number"
                              value={variationForm.stock_quantity}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setVariationForm((prev: CreateProductVariationInput) => ({ 
                                  ...prev, 
                                  stock_quantity: parseInt(e.target.value) || 0 
                                }))
                              }
                              min="0"
                              required
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? 'Menyimpan...' : 'Simpan Variasi'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {productVariations.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <div className="text-4xl mb-4">🎨</div>
                    <p className="text-gray-500 mb-4">Belum ada variasi untuk produk ini</p>
                    <Button 
                      onClick={() => setIsVariationDialogOpen(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Tambah Variasi Pertama
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Daftar Variasi</CardTitle>
                    <CardDescription>
                      {productVariations.length} variasi tersedia
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama Variasi</TableHead>
                          <TableHead>Warna</TableHead>
                          <TableHead>Ukuran</TableHead>
                          <TableHead>Bahan</TableHead>
                          <TableHead>Harga Satuan</TableHead>
                          <TableHead>Harga Grosir</TableHead>
                          <TableHead>Stok</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productVariations.map((variation: ProductVariation) => (
                          <TableRow key={variation.id}>
                            <TableCell className="font-medium">
                              {variation.variation_name}
                            </TableCell>
                            <TableCell>
                              {variation.color ? (
                                <Badge variant="outline">{variation.color}</Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {variation.size ? (
                                <Badge variant="outline">{variation.size}</Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {variation.material ? (
                                <Badge variant="outline">{variation.material}</Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              
                              Rp {variation.unit_price.toLocaleString('id-ID')}
                            </TableCell>
                            <TableCell>
                              Rp {variation.wholesale_price.toLocaleString('id-ID')}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={variation.stock_quantity > 0 ? "default" : "destructive"}
                              >
                                {variation.stock_quantity} pcs
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingVariation(variation);
                                    setIsEditVariationDialogOpen(true);
                                  }}
                                >
                                  ✏️
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive">🗑️</Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Hapus Variasi</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Apakah Anda yakin ingin menghapus variasi "{variation.variation_name}"?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Batal</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDeleteVariation(variation.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Hapus
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Product Dialog */}
      <Dialog open={isEditProductDialogOpen} onOpenChange={setIsEditProductDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Produk</DialogTitle>
            <DialogDescription>
              Ubah informasi produk
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div>
                <Label htmlFor="edit-product-name">Nama Produk</Label>
                <Input
                  id="edit-product-name"
                  value={editingProduct.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditingProduct((prev: ProductWithRelations | null) => 
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-product-description">Deskripsi</Label>
                <Textarea
                  id="edit-product-description"
                  value={editingProduct.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditingProduct((prev: ProductWithRelations | null) => 
                      prev ? { ...prev, description: e.target.value || null } : null
                    )
                  }
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-product-image">URL Foto Produk</Label>
                <Input
                  id="edit-product-image"
                  type="url"
                  value={editingProduct.image_url || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditingProduct((prev: ProductWithRelations | null) => 
                      prev ? { ...prev, image_url: e.target.value || null } : null
                    )
                  }
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Variation Dialog */}
      <Dialog open={isEditVariationDialogOpen} onOpenChange={setIsEditVariationDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Variasi</DialogTitle>
            <DialogDescription>
              Ubah informasi variasi produk
            </DialogDescription>
          </DialogHeader>
          {editingVariation && (
            <form onSubmit={handleUpdateVariation} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-variation-name">Nama Variasi</Label>
                  <Input
                    id="edit-variation-name"
                    value={editingVariation.variation_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditingVariation((prev: ProductVariation | null) => 
                        prev ? { ...prev, variation_name: e.target.value } : null
                      )
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-variation-color">Warna</Label>
                  <Input
                    id="edit-variation-color"
                    value={editingVariation.color || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditingVariation((prev: ProductVariation | null) => 
                        prev ? { ...prev, color: e.target.value || null } : null
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-variation-size">Ukuran</Label>
                  <Input
                    id="edit-variation-size"
                    value={editingVariation.size || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditingVariation((prev: ProductVariation | null) => 
                        prev ? { ...prev, size: e.target.value || null } : null
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-variation-material">Bahan</Label>
                  <Input
                    id="edit-variation-material"
                    value={editingVariation.material || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditingVariation((prev: ProductVariation | null) => 
                        prev ? { ...prev, material: e.target.value || null } : null
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-variation-unit-price">Harga Satuan (Rp)</Label>
                  <Input
                    id="edit-variation-unit-price"
                    type="number"
                    value={editingVariation.unit_price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditingVariation((prev: ProductVariation | null) => 
                        prev ? { ...prev, unit_price: parseFloat(e.target.value) || 0 } : null
                      )
                    }
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-variation-wholesale-price">Harga Grosir (Rp)</Label>
                  <Input
                    id="edit-variation-wholesale-price"
                    type="number"
                    value={editingVariation.wholesale_price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditingVariation((prev: ProductVariation | null) => 
                        prev ? { ...prev, wholesale_price: parseFloat(e.target.value) || 0 } : null
                      )
                    }
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-variation-stock">Jumlah Stok</Label>
                  <Input
                    id="edit-variation-stock"
                    type="number"
                    value={editingVariation.stock_quantity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditingVariation((prev: ProductVariation | null) => 
                        prev ? { ...prev, stock_quantity: parseInt(e.target.value) || 0 } : null
                      )
                    }
                    min="0"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
