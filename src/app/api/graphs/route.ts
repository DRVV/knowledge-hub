import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Graph, GraphListItem } from '@/types/graph';
import { ObjectId } from 'mongodb';

// GET /api/graphs - List all graphs with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const provider = searchParams.get('provider');
    
    const db = await getDatabase();
    const collection = db.collection('graphs');
    
    // Build filter query
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (provider) {
      filter['metadata.provider'] = provider;
    }
    
    // Get total count
    const total = await collection.countDocuments(filter);
    
    // Get paginated results
    const graphs = await collection
      .find(filter)
      .project({
        title: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
        createdBy: 1,
        metadata: 1,
        nodeCount: { $size: '$nodes' },
        edgeCount: { $size: '$edges' },
      })
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
    
    const graphList: GraphListItem[] = graphs.map(graph => ({
      _id: graph._id.toString(),
      title: graph.title,
      description: graph.description,
      createdAt: graph.createdAt,
      updatedAt: graph.updatedAt,
      createdBy: graph.createdBy,
      nodeCount: graph.nodeCount || 0,
      edgeCount: graph.edgeCount || 0,
      metadata: graph.metadata,
    }));
    
    return NextResponse.json({
      graphs: graphList,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching graphs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch graphs' },
      { status: 500 }
    );
  }
}

// POST /api/graphs - Create a new graph
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, nodes = [], edges = [], metadata = {} } = body;
    
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    
    const db = await getDatabase();
    const collection = db.collection('graphs');
    
    const newGraph: Omit<Graph, '_id'> = {
      title,
      description: description || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'anonymous', // TODO: Replace with actual user when auth is implemented
      metadata: {
        provider: metadata.provider || 'manual',
        originalFilename: metadata.originalFilename || '',
        ...metadata,
      },
      nodes,
      edges,
      viewport: {
        x: 0,
        y: 0,
        zoom: 1,
      },
    };
    
    const result = await collection.insertOne(newGraph);
    
    return NextResponse.json({
      _id: result.insertedId.toString(),
      ...newGraph,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating graph:', error);
    return NextResponse.json(
      { error: 'Failed to create graph' },
      { status: 500 }
    );
  }
}
