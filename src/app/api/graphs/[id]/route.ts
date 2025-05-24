import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Graph } from '@/types/graph';
import { ObjectId } from 'mongodb';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/graphs/[id] - Get a specific graph by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid graph ID' },
        { status: 400 }
      );
    }
    
    const db = await getDatabase();
    const collection = db.collection('graphs');
    
    const graph = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!graph) {
      return NextResponse.json(
        { error: 'Graph not found' },
        { status: 404 }
      );
    }
    
    const result: Graph = {
      _id: graph._id.toString(),
      title: graph.title,
      description: graph.description,
      createdAt: graph.createdAt,
      updatedAt: graph.updatedAt,
      createdBy: graph.createdBy,
      metadata: graph.metadata,
      nodes: graph.nodes,
      edges: graph.edges,
      viewport: graph.viewport,
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching graph:', error);
    return NextResponse.json(
      { error: 'Failed to fetch graph' },
      { status: 500 }
    );
  }
}

// PUT /api/graphs/[id] - Update an existing graph
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid graph ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { title, description, nodes, edges, metadata, viewport } = body;
    
    const db = await getDatabase();
    const collection = db.collection('graphs');
    
    const updateData: Partial<Graph> = {
      updatedAt: new Date(),
    };
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (nodes !== undefined) updateData.nodes = nodes;
    if (edges !== undefined) updateData.edges = edges;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (viewport !== undefined) updateData.viewport = viewport;
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Graph not found' },
        { status: 404 }
      );
    }
    
    // Fetch and return the updated graph
    const updatedGraph = await collection.findOne({ _id: new ObjectId(id) });
    
    return NextResponse.json({
      ...updatedGraph,
      _id: updatedGraph!._id.toString(),
    });
  } catch (error) {
    console.error('Error updating graph:', error);
    return NextResponse.json(
      { error: 'Failed to update graph' },
      { status: 500 }
    );
  }
}

// DELETE /api/graphs/[id] - Delete a graph
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid graph ID' },
        { status: 400 }
      );
    }
    
    const db = await getDatabase();
    const collection = db.collection('graphs');
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Graph not found' },
        { status: 404 }
      );
    }
    
    // Also delete related comments and versions
    await db.collection('comments').deleteMany({ 
      targetType: 'graph',
      targetId: id 
    });
    
    await db.collection('versions').deleteMany({ 
      graphId: new ObjectId(id) 
    });
    
    return NextResponse.json({ message: 'Graph deleted successfully' });
  } catch (error) {
    console.error('Error deleting graph:', error);
    return NextResponse.json(
      { error: 'Failed to delete graph' },
      { status: 500 }
    );
  }
}
