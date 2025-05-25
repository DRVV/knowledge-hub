const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'knowledge-hub';

const sampleGraphs = [
  {
    title: "Semiconductor Supply Chain Analysis",
    description: "Analysis of global semiconductor supply chain disruptions and their impact on various industries.",
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "analyst@techcorp.com",
    metadata: {
      provider: "internal-research",
      originalFilename: "semiconductor_analysis_2024.json",
      csvPath: "/data/semiconductor_supply_chain.csv"
    },
    nodes: [
      {
        id: "node-1",
        type: "default",
        position: { x: 250, y: 5 },
        data: {
          label: "COVID-19 Pandemic",
          description: "Global pandemic disrupting manufacturing and logistics",
          eventType: "external-shock",
          timestamp: new Date('2020-03-01')
        }
      },
      {
        id: "node-2",
        type: "default", 
        position: { x: 100, y: 100 },
        data: {
          label: "Factory Shutdowns",
          description: "Manufacturing plants closed in Asia",
          eventType: "operational-impact",
          timestamp: new Date('2020-04-01')
        }
      },
      {
        id: "node-3",
        type: "default",
        position: { x: 400, y: 100 },
        data: {
          label: "Increased Demand",
          description: "Rising demand for electronics and automotive chips",
          eventType: "market-demand",
          timestamp: new Date('2020-06-01')
        }
      },
      {
        id: "node-4",
        type: "default",
        position: { x: 250, y: 200 },
        data: {
          label: "Global Chip Shortage",
          description: "Widespread shortage affecting multiple industries",
          eventType: "supply-shortage",
          timestamp: new Date('2021-01-01')
        }
      }
    ],
    edges: [
      {
        id: "edge-1",
        source: "node-1",
        target: "node-2",
        type: "default",
        animated: true,
        data: {
          label: "caused",
          relationshipType: "causal",
          strength: 0.9
        }
      },
      {
        id: "edge-2", 
        source: "node-1",
        target: "node-3",
        type: "default",
        animated: true,
        data: {
          label: "triggered",
          relationshipType: "causal",
          strength: 0.7
        }
      },
      {
        id: "edge-3",
        source: "node-2",
        target: "node-4",
        type: "default",
        animated: true,
        data: {
          label: "contributed to",
          relationshipType: "contributory",
          strength: 0.8
        }
      },
      {
        id: "edge-4",
        source: "node-3",
        target: "node-4",
        type: "default",
        animated: true,
        data: {
          label: "amplified",
          relationshipType: "amplifying",
          strength: 0.6
        }
      }
    ],
    viewport: {
      x: 0,
      y: 0,
      zoom: 1
    }
  },
  {
    title: "AI Development Timeline",
    description: "Key milestones and breakthroughs in artificial intelligence development",
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "researcher@ailab.org",
    metadata: {
      provider: "academic-research",
      originalFilename: "ai_timeline_2024.json",
      csvPath: "/data/ai_development_timeline.csv"
    },
    nodes: [
      {
        id: "ai-node-1",
        type: "default",
        position: { x: 100, y: 50 },
        data: {
          label: "Deep Learning Renaissance",
          description: "Revival of neural networks with deep architectures",
          eventType: "breakthrough",
          timestamp: new Date('2012-01-01')
        }
      },
      {
        id: "ai-node-2",
        type: "default",
        position: { x: 300, y: 50 },
        data: {
          label: "Transformer Architecture",
          description: "Introduction of attention mechanism",
          eventType: "innovation",
          timestamp: new Date('2017-06-01')
        }
      },
      {
        id: "ai-node-3",
        type: "default",
        position: { x: 200, y: 150 },
        data: {
          label: "Large Language Models",
          description: "GPT and similar models emerge",
          eventType: "milestone",
          timestamp: new Date('2019-02-01')
        }
      },
      {
        id: "ai-node-4",
        type: "default",
        position: { x: 200, y: 250 },
        data: {
          label: "ChatGPT Launch",
          description: "Public release of conversational AI",
          eventType: "commercialization",
          timestamp: new Date('2022-11-30')
        }
      }
    ],
    edges: [
      {
        id: "ai-edge-1",
        source: "ai-node-1",
        target: "ai-node-2",
        type: "default",
        data: {
          label: "enabled",
          relationshipType: "enabling",
          strength: 0.8
        }
      },
      {
        id: "ai-edge-2",
        source: "ai-node-2",
        target: "ai-node-3",
        type: "default",
        data: {
          label: "led to",
          relationshipType: "progressive",
          strength: 0.9
        }
      },
      {
        id: "ai-edge-3",
        source: "ai-node-3",
        target: "ai-node-4",
        type: "default",
        data: {
          label: "resulted in",
          relationshipType: "outcome",
          strength: 0.7
        }
      }
    ],
    viewport: {
      x: 0,
      y: 0,
      zoom: 1
    }
  },
  {
    title: "Climate Change Impact Network",
    description: "Interconnected effects of climate change on various systems",
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "climate@research.gov",
    metadata: {
      provider: "government-data",
      originalFilename: "climate_impact_2024.json",
      csvPath: "/data/climate_impact_network.csv"
    },
    nodes: [
      {
        id: "climate-1",
        type: "default",
        position: { x: 250, y: 50 },
        data: {
          label: "Rising Global Temperatures",
          description: "Average global temperature increase",
          eventType: "environmental-change",
          timestamp: new Date('2000-01-01')
        }
      },
      {
        id: "climate-2",
        type: "default",
        position: { x: 100, y: 150 },
        data: {
          label: "Arctic Ice Melting",
          description: "Reduction in polar ice caps",
          eventType: "environmental-impact",
          timestamp: new Date('2005-01-01')
        }
      },
      {
        id: "climate-3",
        type: "default",
        position: { x: 400, y: 150 },
        data: {
          label: "Extreme Weather Events",
          description: "Increased frequency of hurricanes and droughts",
          eventType: "environmental-impact",
          timestamp: new Date('2010-01-01')
        }
      },
      {
        id: "climate-4",
        type: "default",
        position: { x: 250, y: 250 },
        data: {
          label: "Agricultural Disruption",
          description: "Crop failures and food security issues",
          eventType: "economic-impact",
          timestamp: new Date('2015-01-01')
        }
      }
    ],
    edges: [
      {
        id: "climate-edge-1",
        source: "climate-1",
        target: "climate-2",
        type: "default",
        data: {
          label: "causes",
          relationshipType: "causal",
          strength: 0.95
        }
      },
      {
        id: "climate-edge-2",
        source: "climate-1",
        target: "climate-3",
        type: "default",
        data: {
          label: "intensifies",
          relationshipType: "amplifying",
          strength: 0.85
        }
      },
      {
        id: "climate-edge-3",
        source: "climate-3",
        target: "climate-4",
        type: "default",
        data: {
          label: "disrupts",
          relationshipType: "disruptive",
          strength: 0.8
        }
      }
    ],
    viewport: {
      x: 0,
      y: 0,
      zoom: 1
    }
  }
];

async function seedDatabase() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const graphsCollection = db.collection('graphs');

    // Clear existing data
    await graphsCollection.deleteMany({});
    console.log('Cleared existing graphs');

    // Insert sample graphs
    const result = await graphsCollection.insertMany(sampleGraphs);
    console.log(`Inserted ${result.insertedCount} sample graphs`);

    // Display inserted graph IDs and titles
    const insertedGraphs = await graphsCollection.find({}).toArray();
    console.log('\nInserted graphs:');
    insertedGraphs.forEach((graph, index) => {
      console.log(`${index + 1}. ${graph.title} (ID: ${graph._id})`);
      console.log(`   Nodes: ${graph.nodes.length}, Edges: ${graph.edges.length}`);
      console.log(`   Provider: ${graph.metadata.provider}\n`);
    });

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

seedDatabase();
