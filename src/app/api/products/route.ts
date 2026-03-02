import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// ============================================================================
// INTERFACES
// ============================================================================

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  categoryId?: string;
  available: boolean;
  featured: boolean;
  image: string | null;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  order: number;
}

interface ProductsData {
  products: Product[];
  categories: Category[];
  updatedAt: string;
}

interface ProductsResponse {
  success: boolean;
  data?: ProductsData;
  products?: Product[];
  product?: Product;
  error?: string;
}

interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  category: string;
  available?: boolean;
  featured?: boolean;
  image?: string | null;
  stock?: number;
}

interface UpdateProductRequest {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  available?: boolean;
  featured?: boolean;
  image?: string | null;
  stock?: number;
}

// ============================================================================
// FILE-BASED STORAGE
// ============================================================================

const DATA_DIR = path.join(process.cwd(), 'db');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Entradas', icon: '🥗', order: 1 },
  { id: 'cat-2', name: 'Platos Principales', icon: '🍽️', order: 2 },
  { id: 'cat-3', name: 'Bebidas', icon: '🥤', order: 3 },
  { id: 'cat-4', name: 'Postres', icon: '🍰', order: 4 }
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Empanadas (4 uds)',
    description: 'Crujientes empanadas rellenas de carne, pollo o queso con ají casero',
    price: 12000,
    category: 'Entradas',
    available: true,
    featured: true,
    image: null,
    stock: 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-2',
    name: 'Guacamole con Totopos',
    description: 'Aguacate fresco con tortilla chips crujientes y pico de gallo',
    price: 15000,
    category: 'Entradas',
    available: true,
    featured: false,
    image: null,
    stock: 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-3',
    name: 'Bandeja Paisa',
    description: 'El clásico colombiano: frijoles, arroz, carne molida, chicharrón, huevo, aguacate, plátano y arepa',
    price: 35000,
    category: 'Platos Principales',
    available: true,
    featured: true,
    image: null,
    stock: 25,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }
}

async function readProductsData(): Promise<ProductsData> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(PRODUCTS_FILE, 'utf-8');
    return JSON.parse(data) as ProductsData;
  } catch {
    // File doesn't exist, return default and create it
    const defaultData: ProductsData = {
      products: DEFAULT_PRODUCTS,
      categories: DEFAULT_CATEGORIES,
      updatedAt: new Date().toISOString()
    };
    await writeProductsData(defaultData);
    return defaultData;
  }
}

async function writeProductsData(data: ProductsData): Promise<void> {
  await ensureDataDir();
  data.updatedAt = new Date().toISOString();
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ============================================================================
// GET - Obtener todos los productos
// ============================================================================

export async function GET(): Promise<NextResponse<ProductsResponse>> {
  try {
    const data = await readProductsData();
    
    console.log('[Products API] GET products:', data.products.length, 'products');
    
    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('[Products API] Error reading products:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error al leer los productos'
    }, { status: 500 });
  }
}

// ============================================================================
// POST - Crear nuevo producto
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<ProductsResponse>> {
  try {
    const body: CreateProductRequest = await request.json();
    
    console.log('[Products API] POST request:', body.name);
    
    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'El nombre del producto es requerido'
      }, { status: 400 });
    }
    
    if (body.price === undefined || body.price < 0) {
      return NextResponse.json({
        success: false,
        error: 'El precio es requerido y debe ser mayor o igual a 0'
      }, { status: 400 });
    }
    
    // Read current data
    const data = await readProductsData();
    
    // Generate unique ID
    const newProduct: Product = {
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: body.name.trim(),
      description: body.description?.trim() || '',
      price: Number(body.price),
      category: body.category || 'Entradas',
      available: body.available ?? true,
      featured: body.featured ?? false,
      image: body.image || null,
      stock: body.stock ?? 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add product
    data.products.push(newProduct);
    
    // Check if category exists, if not add it
    const categoryExists = data.categories.some(c => c.name === newProduct.category);
    if (!categoryExists && newProduct.category) {
      data.categories.push({
        id: `cat-${Date.now()}`,
        name: newProduct.category,
        icon: '🍴',
        order: data.categories.length + 1
      });
    }
    
    // Save
    await writeProductsData(data);
    
    console.log('[Products API] Product created:', newProduct.id, newProduct.name);
    
    return NextResponse.json({
      success: true,
      product: newProduct
    });

  } catch (error) {
    console.error('[Products API] Error creating product:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error al crear el producto'
    }, { status: 500 });
  }
}

// ============================================================================
// PUT - Actualizar producto existente
// ============================================================================

export async function PUT(request: NextRequest): Promise<NextResponse<ProductsResponse>> {
  try {
    const body: UpdateProductRequest = await request.json();
    
    console.log('[Products API] PUT request for product:', body.id);
    
    if (!body.id) {
      return NextResponse.json({
        success: false,
        error: 'El ID del producto es requerido'
      }, { status: 400 });
    }
    
    // Read current data
    const data = await readProductsData();
    
    // Find product index
    const productIndex = data.products.findIndex(p => p.id === body.id);
    
    if (productIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Producto no encontrado'
      }, { status: 404 });
    }
    
    // Update product
    const currentProduct = data.products[productIndex];
    const updatedProduct: Product = {
      ...currentProduct,
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.description !== undefined && { description: body.description.trim() }),
      ...(body.price !== undefined && { price: Number(body.price) }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.available !== undefined && { available: body.available }),
      ...(body.featured !== undefined && { featured: body.featured }),
      ...(body.image !== undefined && { image: body.image }),
      ...(body.stock !== undefined && { stock: Number(body.stock) }),
      updatedAt: new Date().toISOString()
    };
    
    data.products[productIndex] = updatedProduct;
    
    // Check if category exists, if not add it
    if (body.category) {
      const categoryExists = data.categories.some(c => c.name === body.category);
      if (!categoryExists) {
        data.categories.push({
          id: `cat-${Date.now()}`,
          name: body.category,
          icon: '🍴',
          order: data.categories.length + 1
        });
      }
    }
    
    // Save
    await writeProductsData(data);
    
    console.log('[Products API] Product updated:', updatedProduct.id, updatedProduct.name);
    
    return NextResponse.json({
      success: true,
      product: updatedProduct
    });

  } catch (error) {
    console.error('[Products API] Error updating product:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error al actualizar el producto'
    }, { status: 500 });
  }
}

// ============================================================================
// DELETE - Eliminar producto
// ============================================================================

export async function DELETE(request: NextRequest): Promise<NextResponse<ProductsResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    console.log('[Products API] DELETE request for product:', id);
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'El ID del producto es requerido'
      }, { status: 400 });
    }
    
    // Read current data
    const data = await readProductsData();
    
    // Find and remove product
    const productIndex = data.products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Producto no encontrado'
      }, { status: 404 });
    }
    
    const deletedProduct = data.products.splice(productIndex, 1)[0];
    
    // Save
    await writeProductsData(data);
    
    console.log('[Products API] Product deleted:', deletedProduct.id, deletedProduct.name);
    
    return NextResponse.json({
      success: true,
      product: deletedProduct
    });

  } catch (error) {
    console.error('[Products API] Error deleting product:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error al eliminar el producto'
    }, { status: 500 });
  }
}
