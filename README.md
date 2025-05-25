# Knowledge Hub - AI-Powered Graph Generation

A comprehensive knowledge graph visualization platform with intelligent CSV-to-graph generation powered by Large Language Models (LLMs).

## 🚀 Features

### Core Features
- **Interactive Graph Visualization**: Explore knowledge graphs with React Flow
- **Table View Integration**: View and edit CSV data alongside graph visualization
- **Multiple Export Formats**: Export graphs as PNG, JPEG, or SVG
- **Responsive Design**: Optimized for desktop and mobile devices

### 🆕 AI Graph Generation (New!)
- **LLM-Powered Analysis**: Automatically generate meaningful nodes and edges from CSV data
- **Smart Relationship Detection**: AI identifies entities, processes, events, and their relationships
- **Configurable Parameters**: Customize node/edge limits and provide additional context
- **Multiple AI Providers**: Support for both OpenAI and Azure OpenAI
- **Real-time Feedback**: Visual progress indicators and detailed analysis results

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key OR Azure OpenAI service setup

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd knowledge-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Set up your AI provider** (see Configuration section below)

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## ⚙️ Configuration

### OpenAI Configuration (Development)

Add to your `.env.local` file:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
```

### Azure OpenAI Configuration (Production)

For deployment with Azure OpenAI, add to your `.env.local` file:

```bash
# Azure OpenAI Configuration
USE_AZURE_OPENAI=true
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

## 🎯 How to Use AI Graph Generation

### Step 1: Access the Explorer
1. Navigate to the Explorer page
2. Click on "Table View" to load your CSV data
3. The sidebar will show the "Search" tab with AI generation options

### Step 2: Generate Graph with AI
1. **Load CSV Data**: Click "Table View" to load your source data
2. **Access AI Generator**: In the sidebar's "Search" tab, scroll down to find the AI Graph Generation section
3. **Configure Options** (Optional):
   - Click "Options" to customize:
   - **Additional Context**: Provide domain-specific information to help the AI
   - **Max Nodes**: Set the maximum number of nodes to generate (5-50)
   - **Max Edges**: Set the maximum number of relationships to create (5-100)
4. **Generate**: Click "Generate Graph with AI"
5. **Review Results**: The AI will analyze your data and show:
   - Success message with node/edge counts
   - Processing statistics
   - AI reasoning behind the analysis

### Step 3: Explore Generated Graph
- The new graph will automatically replace the current visualization
- Use the standard graph tools for further exploration:
  - Zoom and pan
  - Select nodes and edges for details
  - Export the generated graph

## 🧠 How AI Graph Generation Works

### Analysis Process
1. **Data Preprocessing**: The system samples your CSV data (up to 50 rows) for analysis
2. **LLM Analysis**: The AI identifies:
   - **Entities**: People, places, concepts, materials
   - **Processes**: Actions, workflows, procedures
   - **Events**: Time-based occurrences
   - **Relationships**: Causal, temporal, dependency, and associative connections
3. **Graph Generation**: Creates optimally positioned nodes and meaningful edges
4. **Validation**: Ensures all relationships reference valid nodes

### Node Types
- **Event**: Time-based occurrences or milestones
- **Process**: Actions, workflows, or procedures
- **Material**: Physical or conceptual materials
- **Entity**: People, organizations, or concepts
- **Concept**: Abstract ideas or categories

### Edge Types
- **Causal**: Cause-and-effect relationships
- **Process**: Workflow or procedural connections
- **Temporal**: Time-based sequences
- **Dependency**: Required relationships
- **Association**: General connections

## 📊 Supported Data Formats

### CSV Requirements
- **Headers**: First row should contain column names
- **Content**: Any structured data with relationships
- **Size**: Optimal performance with datasets under 10,000 rows
- **Encoding**: UTF-8 recommended

### Example CSV Structures

**Manufacturing Process Data:**
```csv
Process,Material,Output,Duration,Department
Mixing,Raw Chemicals,Mixed Solution,30 min,Chemistry
Heating,Mixed Solution,Heated Compound,45 min,Processing
Quality Check,Heated Compound,Approved Product,15 min,QA
```

**Organizational Data:**
```csv
Person,Department,Role,Reports To,Project
Alice,Engineering,Manager,Bob,Project A
Bob,Engineering,Director,CEO,Project A
Carol,Marketing,Specialist,Dave,Project B
```

## 🎨 Interface Overview

### Main Components
- **Graph Canvas**: Interactive visualization area
- **Sidebar Tabs**:
  - **Search**: AI generation tools and node creation
  - **Properties**: Selected element details
  - **Comments**: Collaboration features
- **Table View**: CSV data viewer/editor (toggle on/off)
- **Export Tools**: PNG, JPEG, SVG export options

### Layout Options
- **Bottom**: Table below graph (default)
- **Right**: Table beside graph (side-by-side)
- **Overlay**: Floating table over graph

## 🔧 Development

### Project Structure
```
knowledge-hub/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate-graph/     # LLM graph generation API
│   │   │   ├── graphs/             # Graph CRUD operations
│   │   │   └── csv/                # CSV data handling
│   │   ├── explorer/               # Main application page
│   │   └── page.tsx                # Landing page
│   ├── components/
│   │   ├── Graph/
│   │   │   ├── GraphGenerator.tsx  # AI generation component
│   │   │   ├── GraphCanvas.tsx     # Main visualization
│   │   │   └── ...
│   │   └── Table/                  # CSV table components
│   ├── types/
│   │   └── graph.ts                # TypeScript definitions
│   └── utils/
│       └── csvParser.ts            # CSV processing utilities
└── public/
    └── data/                       # Sample CSV files
```

### Build Commands
```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
```

## 🚨 Error Handling

### Common Issues

**API Key Not Configured**
- Error: "OpenAI API key not configured"
- Solution: Set `OPENAI_API_KEY` in your `.env.local` file

**Quota Exceeded**
- Error: "OpenAI API quota exceeded"
- Solution: Check your OpenAI billing and usage limits

**Invalid CSV Data**
- Error: "Invalid CSV data provided"
- Solution: Ensure your CSV has headers and valid data rows

**Generation Timeout**
- The AI generation may take 10-30 seconds for complex datasets
- Large datasets are automatically sampled to ensure performance

## 🔐 Security Considerations

- API keys are server-side only and never exposed to the client
- CSV data is processed locally and only metadata is sent to the LLM
- All AI requests are rate-limited and validated
- No sensitive data is stored permanently by the AI service

## 📈 Performance Tips

### For Large Datasets
- Use smaller CSV files (< 10,000 rows) for faster processing
- Provide specific context to help the AI focus on relevant relationships
- Start with lower node/edge limits and increase as needed

### For Better AI Results
- Clean your CSV data (remove empty rows, standardize formats)
- Use descriptive column headers
- Provide domain-specific context in the options
- Include relevant relationships in your data structure

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues, questions, or feature requests:
1. Check the existing issues in the repository
2. Create a new issue with detailed information
3. Include error messages, CSV samples, and screenshots when relevant

---

**Happy Knowledge Graphing! 🚀📊**
