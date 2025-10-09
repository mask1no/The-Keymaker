import { NextRequest, NextResponse } from 'next/server';
import 'server-only';
import { z } from 'zod';
import { getSessionFromCookies } from '@/lib/server/session';
import { getDb } from '@/lib/db/sqlite';

const templateSchema = z.object({
  name: z.string().min(1).max(32),
  symbol: z.string().min(1).max(10),
  description: z.string().optional(),
  image: z.string().url().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  supply: z.number().min(1).max(1000000000).optional(),
  decimals: z.number().min(0).max(18).optional(),
});

const querySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
});

// GET - Fetch coin templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      search: searchParams.get('search'),
      category: searchParams.get('category'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    });

    const db = getDb();

    let sql = 'SELECT * FROM coin_templates WHERE 1=1';
    const params: string[] = [];

    if (query.search) {
      sql += ' AND (name LIKE ? OR symbol LIKE ? OR description LIKE ?)';
      const searchTerm = `%${query.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (query.category) {
      sql += ' AND category = ?';
      params.push(query.category);
    }

    sql += ' ORDER BY created_at DESC';

    if (query.limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(query.limit));

      if (query.offset) {
        sql += ' OFFSET ?';
        params.push(parseInt(query.offset));
      }
    }

    const templates = db.all(sql, ...params);

    return NextResponse.json({
      success: true,
      templates,
      total: templates.length,
    });
  } catch (error) {
    // Error fetching coin templates

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch templates',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 },
    );
  }
}

// POST - Create new coin template
export async function POST(request: NextRequest) {
  const session = getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = templateSchema.parse(body);

    const db = getDb();

    // Check if template already exists
    const existing = db.get('SELECT id FROM coin_templates WHERE name = ? AND symbol = ?', [
      validatedData.name,
      validatedData.symbol,
    ]);

    if (existing) {
      return NextResponse.json(
        { error: 'Template already exists with this name and symbol' },
        { status: 409 },
      );
    }

    // Insert new template
    const result = db.run(
      `INSERT INTO coin_templates (
        user_id, name, symbol, description, image, category, tags, 
        supply, decimals, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.sub,
        validatedData.name,
        validatedData.symbol,
        validatedData.description || '',
        validatedData.image || '',
        validatedData.category || 'General',
        JSON.stringify(validatedData.tags || []),
        validatedData.supply || 1000000000,
        validatedData.decimals || 9,
        new Date().toISOString(),
        new Date().toISOString(),
      ],
    );

    return NextResponse.json({
      success: true,
      templateId: result.lastInsertRowid,
      message: 'Template created successfully',
    });
  } catch (error) {
    // Error creating coin template

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create template',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 },
    );
  }
}
