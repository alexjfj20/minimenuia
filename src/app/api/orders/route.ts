// =============================================
// MINIMENU - Orders API (con pg directo)
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string | null;
}

interface Order {
  id: string;
  businessId: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  customerAddress: string | null;
  customerNotes: string | null;
  orderType: string;
  orderNumber: string;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  currency: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  neighborhood: string | null;
  estimatedDelivery: string | null;
  driverName: string | null;
  invoiceNumber: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

// GET - List Orders
export async function GET(request: NextRequest): Promise<NextResponse> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json(
      { success: false, error: 'Base de datos no configurada' },
      { status: 500 }
    );
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10000,
  });

  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const orderType = searchParams.get('orderType');
    const status = searchParams.get('status');

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      let query = `
        SELECT * FROM orders
        WHERE "businessId" = $1
      `;
      const params: (string | null)[] = [businessId];
      let paramIndex = 2;

      if (orderType) {
        query += ` AND "orderType" = $${paramIndex}`;
        params.push(orderType);
        paramIndex++;
      }

      if (status) {
        query += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      query += ' ORDER BY "createdAt" DESC';

      const ordersResult = await client.query(query, params);
      const orders: Order[] = ordersResult.rows;

      // Get items for each order
      for (const order of orders) {
        const itemsResult = await client.query(
          'SELECT * FROM order_items WHERE "orderId" = $1',
          [order.id]
        );
        order.items = itemsResult.rows;
      }

      return NextResponse.json({
        success: true,
        data: orders,
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('[Orders API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener pedidos' },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}

// POST - Create Order
export async function POST(request: NextRequest): Promise<NextResponse> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json(
      { success: false, error: 'Base de datos no configurada' },
      { status: 500 }
    );
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10000,
  });

  try {
    const body = await request.json();
    const {
      businessId,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      customerNotes,
      orderType = 'RESTAURANT',
      subtotal = 0,
      deliveryFee = 0,
      tax = 0,
      total,
      paymentMethod,
      neighborhood,
      estimatedDelivery,
      invoiceNumber,
      notes,
      items = [],
    } = body;

    if (!businessId || !customerName) {
      return NextResponse.json(
        { success: false, error: 'businessId y customerName son requeridos' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Generate order number
      const orderNumberResult = await client.query(`
        SELECT COUNT(*)::int + 1 as next_number FROM orders WHERE "businessId" = $1
      `, [businessId]);
      const orderNumber = `ORD-${String(orderNumberResult.rows[0].next_number).padStart(4, '0')}`;

      // Generate UUID for order
      const idResult = await client.query('SELECT gen_random_uuid() as id');
      const orderId = idResult.rows[0].id;

      // Create order
      await client.query(`
        INSERT INTO orders (
          id, "businessId", "customerName", "customerPhone", "customerEmail",
          "customerAddress", "customerNotes", "orderType", "orderNumber",
          subtotal, "deliveryFee", tax, total, status, "paymentStatus",
          "paymentMethod", neighborhood, "estimatedDelivery", "invoiceNumber", notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      `, [
        orderId, businessId, customerName, customerPhone || null, customerEmail || null,
        customerAddress || null, customerNotes || null, orderType, orderNumber,
        subtotal, deliveryFee, tax, total, 'PENDING', 'PENDING',
        paymentMethod || null, neighborhood || null, estimatedDelivery || null, invoiceNumber || null, notes || null
      ]);

      // Create order items
      for (const item of items) {
        const itemIdResult = await client.query('SELECT gen_random_uuid() as id');
        const itemId = itemIdResult.rows[0].id;

        await client.query(`
          INSERT INTO order_items (id, "orderId", "productId", "productName", quantity, "unitPrice", "totalPrice", notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          itemId, orderId, item.productId, item.productName, item.quantity || 1,
          item.unitPrice || 0, item.totalPrice || 0, item.notes || null
        ]);
      }

      return NextResponse.json({
        success: true,
        data: { id: orderId, orderNumber },
        message: 'Pedido creado exitosamente',
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('[Orders API] Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear pedido' },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}

// PUT - Update Order
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json(
      { success: false, error: 'Base de datos no configurada' },
      { status: 500 }
    );
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10000,
  });

  try {
    const body = await request.json();
    const { id, status, paymentStatus, paymentMethod, driverName, notes } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID del pedido es requerido' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      const updates: string[] = [];
      const values: (string | null)[] = [];
      let paramIndex = 1;

      if (status !== undefined) {
        updates.push(`status = $${paramIndex}`);
        values.push(status);
        paramIndex++;
      }
      if (paymentStatus !== undefined) {
        updates.push(`"paymentStatus" = $${paramIndex}`);
        values.push(paymentStatus);
        paramIndex++;
      }
      if (paymentMethod !== undefined) {
        updates.push(`"paymentMethod" = $${paramIndex}`);
        values.push(paymentMethod);
        paramIndex++;
      }
      if (driverName !== undefined) {
        updates.push(`"driverName" = $${paramIndex}`);
        values.push(driverName);
        paramIndex++;
      }
      if (notes !== undefined) {
        updates.push(`notes = $${paramIndex}`);
        values.push(notes);
        paramIndex++;
      }

      if (updates.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No hay campos para actualizar' },
          { status: 400 }
        );
      }

      values.push(id);
      const query = `UPDATE orders SET ${updates.join(', ')} WHERE id = $${paramIndex}`;

      await client.query(query, values);

      return NextResponse.json({
        success: true,
        message: 'Pedido actualizado',
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('[Orders API] Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar pedido' },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}

// DELETE - Delete Order
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json(
      { success: false, error: 'Base de datos no configurada' },
      { status: 500 }
    );
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10000,
  });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID del pedido es requerido' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Delete order items first
      await client.query('DELETE FROM order_items WHERE "orderId" = $1', [id]);
      // Delete order
      await client.query('DELETE FROM orders WHERE id = $1', [id]);

      return NextResponse.json({
        success: true,
        message: 'Pedido eliminado',
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('[Orders API] Error deleting order:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar pedido' },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
