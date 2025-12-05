# WOD Image Processor - Architecture Diagram

## System Architecture Overview

```mermaid
graph TB
    subgraph "Input Layer"
        A[ExampleData/ Directory]
        B[40 JPG Images]
        C[exercises.json]
    end
    
    subgraph "Configuration Layer"
        D[.env File]
        E[OPENROUTER_API_KEY]
        F[package.json]
    end
    
    subgraph "Processing Layer"
        G[process-wod-images.js]
        H[Image Discovery Module]
        I[Base64 Encoding Module]
        J[OpenRouter API Client]
        K[Gemini 2.5 Processing]
        L[JSON Validation]
    end
    
    subgraph "Output Layer"
        M[output/ Directory]
        N[Generated JSON Files]
    end
    
    subgraph "External Services"
        O[OpenRouter API]
        P[Gemini 2.5 Model]
    end
    
    A --> H
    B --> I
    D --> J
    F --> G
    H --> I
    I --> J
    J --> O
    O --> P
    P --> K
    K --> L
    L --> N
    M --> N
    
    style G fill:#e1f5ff
    style O fill:#fff3e0
    style P fill:#fff3e0
```

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant User as User
    participant Script as process-wod-images.js
    participant FS as File System
    participant API as OpenRouter API
    participant Gemini as Gemini 2.5
    participant Output as Output Directory
    
    User->>Script: Run script
    Script->>FS: Discover images in ExampleData/
    FS-->>Script: List of JPG files
    loop For each image
        Script->>FS: Read image file
        FS-->>Script: Image data
        Script->>Script: Convert to base64
        Script->>API: Send vision request
        API->>Gemini: Process image + prompt
        Gemini-->>API: JSON response
        API-->>Script: AI response
        Script->>Script: Parse JSON
        Script->>Output: Save JSON file
    end
```

## Module Dependencies

```mermaid
graph LR
    A[process-wod-images.js] --> B[openai SDK]
    A --> C[dotenv]
    A --> D[fs/promises]
    A --> E[path]
    
    B --> F[OpenRouter API]
    C --> G[.env file]
    
    style A fill:#e1f5ff
    style F fill:#fff3e0
```

## Error Handling Flow

```mermaid
graph TD
    A[Start Processing] --> B{API Key Exists?}
    B -->|No| C[Throw Error: Missing API Key]
    B -->|Yes| D[Discover Images]
    D --> E{Images Found?}
    E -->|No| F[Throw Error: No Images]
    E -->|Yes| G[Process First Image]
    G --> H[Send to Gemini]
    H --> I{API Success?}
    I -->|No| J[Throw Error: API Failed]
    I -->|Yes| K[Parse Response]
    K --> L{Valid JSON?}
    L -->|No| M[Throw Error: Invalid JSON]
    L -->|Yes| N[Save JSON File]
    N --> O{More Images?}
    O -->|Yes| G
    O -->|No| P[Complete Successfully]
    
    style C fill:#ffcdd2
    style F fill:#ffcdd2
    style J fill:#ffcdd2
    style M fill:#ffcdd2
    style P fill:#c8e6c9
```

## File Structure Mapping

```mermaid
graph TD
    A[Martin/ExampleDataProcessor/] --> B[ExampleData/]
    A --> C[output/]
    A --> D[process-wod-images.js]
    A --> E[package.json]
    A --> F[.env]
    A --> G[README.md]
    
    B --> H[40 JPG Images]
    B --> I[exercises.json]
    C --> J[Generated JSON Files]
    
    D --> K[Image Discovery]
    D --> L[Base64 Encoding]
    D --> M[API Client]
    D --> N[Output Manager]
    
    style A fill:#e1f5ff
    style D fill:#e1f5ff
    style C fill:#e8f5e9
```

## API Integration Details

```mermaid
graph LR
    A[Node.js Script] --> B[OpenAI SDK]
    B --> C[OpenRouter Endpoint]
    C --> D[https://openrouter.ai/api/v1]
    D --> E[Gemini 2.5 Model]
    E --> F[google/gemini-2.0-flash-exp:free]
    
    style A fill:#e1f5ff
    style F fill:#fff3e0
```

## Processing Pipeline

```mermaid
flowchart LR
    A[Image File] --> B[Read File]
    B --> C[Convert to Base64]
    C --> D[Create API Request]
    D --> E[Send to Gemini 2.5]
    E --> F[Receive JSON Response]
    F --> G[Validate JSON]
    G --> H[Save to Output Directory]
    
    style A fill:#e8f5e9
    style H fill:#e8f5e9