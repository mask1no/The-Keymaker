import { NextRequest, NextResponse } from 'next/server';
import 'server-only';
import { z } from 'zod';
import { getSession } from '@/lib/server/session';
import { getDb } from '@/lib/db/sqlite';

const updateSchema = z.object({
  name: z.string().min(1).max(32).optional(),
  symbol: z.string().min(1).max(10).optional(),
  description: z.string().optional(),
  image: z.string().url().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  supply: z.number().min(1).max(1000000000).optional(),
  decimals: z.number().min(0).max(18).optional(),
});

// GET - Fetch specific coin template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = parseInt(params.id);
    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      );
    }

    const db = getDb();
    const template = db.get(
      'SELECT * FROM coin_templates WHERE id = ?',
      [templateId]
    );

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Parse tags JSON
    if (template.tags) {
      template.tags = JSON.parse(template.tags);
    }

    return NextResponse.json({
      success: true,
      template,
    });

  } catch (error) {
    console.error('Error fetching coin template:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch template',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 },
    );
  }
}

// PUT - Update coin template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const templateId = parseInt(params.id);
    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateSchema.parse(body);

    const db = getDb();
    
    // Check if template exists and user owns it
    const existing = db.get(
      'SELECT id FROM coin_templates WHERE id = ? AND user_id = ?',
      [templateId, session.sub]
    );
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Template not found or access denied' },
        { status: 404 }
      );
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        if (key === 'tags') {
          updateValues.push(JSON.stringify(value));
        } else {
          updateValues.push(value);
        }
      }
    });
    
    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }
    
    updateFields.push('updated_at = ?');
    updateValues.push(new Date().toISOString());
    updateValues.push(templateId);

    const result = db.run(
      `UPDATE coin_templates SET ${updateFields.join(', ')} WHERE id = ?`,
      ...updateValues
    );

    return NextResponse.json({
      success: true,
      message: 'Template updated successfully',
      changes: result.changes,
    });

  } catch (error) {
    console.error('Error updating coin template:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to update template',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 },
    );
  }
}

// DELETE - Delete coin template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const templateId = parseInt(params.id);
    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      );
    }

    const db = getDb();
    
    // Check if template exists and user owns it
    const existing = db.get(
      'SELECT id FROM coin_templates WHERE id = ? AND user_id = ?',
      [templateId, session.sub]
    );
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Template not found or access denied' },
        { status: 404 }
      );
    }

    const result = db.run(
      'DELETE FROM coin_templates WHERE id = ?',
      [templateId]
    );

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
      changes: result.changes,
    });

  } catch (error) {
    console.error('Error deleting coin template:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete template',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 },
    );
  }
}
