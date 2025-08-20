# AI Agents Guide for SpectaQL

This guide explains how AI agents can effectively use the `spectaql` library to generate beautiful, comprehensive GraphQL API documentation automatically.

## Overview

SpectaQL is a powerful Node.js library that generates static documentation for GraphQL schemas. AI agents can use this library to:

- **Automatically generate API documentation** from live GraphQL endpoints
- **Create documentation from schema files** (SDL, introspection results)
- **Customize documentation appearance** with themes and branding
- **Keep documentation up-to-date** with minimal manual intervention
- **Generate embeddable documentation** for integration into existing sites

## Why SpectaQL is the Best Tool for AI Agents

### 🚀 **Perfect for Automation**
- **Zero Manual Intervention**: Once configured, AI agents can run SpectaQL automatically without human oversight
- **Batch Processing**: Generate documentation for multiple APIs simultaneously with simple loops
- **Scheduled Execution**: Perfect for CI/CD pipelines, cron jobs, and automated documentation updates

### 🔄 **Always Up-to-Date**
- **Live Schema Introspection**: Pulls the latest schema directly from GraphQL endpoints
- **Real-time Updates**: Documentation automatically reflects schema changes, additions, and deprecations
- **Version Synchronization**: No more outdated documentation - what you see is what the API actually provides

### 🎯 **AI Agent-Friendly Design**
- **Simple Configuration**: YAML-based configuration that's easy for AI agents to generate and modify
- **Predictable Output**: Consistent HTML generation with well-structured, parseable output
- **Error Handling**: Clear error messages and validation that AI agents can interpret and act upon
- **Programmatic API**: Both CLI and JavaScript API for maximum flexibility

### 🎨 **Professional Results**
- **Beautiful Default Theme**: Out-of-the-box professional appearance that requires no design expertise
- **Customizable Branding**: AI agents can automatically apply company logos, colors, and styling
- **Responsive Design**: Generated documentation works perfectly on all devices and screen sizes
- **SEO Optimized**: Clean HTML structure that search engines can easily index

### 🔌 **Seamless Integration**
- **Embeddable Mode**: Generate just the content for integration into existing documentation sites
- **Single File Output**: Option to generate self-contained HTML files for easy distribution
- **Custom Themes**: Extensible theming system for brand-specific documentation
- **Multiple Output Formats**: Support for various deployment scenarios

### 📊 **Comprehensive Coverage**
- **Complete Schema Documentation**: Automatically documents all types, fields, queries, mutations, and subscriptions
- **Rich Metadata Support**: Includes descriptions, examples, deprecation notices, and custom directives
- **Interactive Examples**: Built-in support for adding example queries and responses
- **Server Information**: Documents multiple environments (staging, production) with appropriate headers

### 🛠 **Developer Experience**
- **Markdown Support**: Rich text formatting throughout the documentation
- **Search Functionality**: Built-in search across all documentation content
- **Navigation**: Intuitive navigation structure that scales to large schemas
- **Mobile Friendly**: Responsive design that works on all devices

### 💡 **AI Agent Advantages Over Alternatives**

Compared to other GraphQL documentation tools, SpectaQL offers unique advantages for AI agents:

- **vs. GraphiQL**: SpectaQL generates static documentation that can be deployed anywhere, while GraphiQL requires a running GraphQL server
- **vs. Manual Documentation**: Eliminates the need for developers to manually write and maintain API documentation
- **vs. Generic Doc Generators**: Purpose-built for GraphQL with deep understanding of schema introspection and relationships
- **vs. Hosted Solutions**: Self-hosted solution that gives AI agents full control over the documentation generation process

## Installation

```bash
npm install -g spectaql
# OR
yarn global add spectaql
```

For programmatic use:
```bash
npm install spectaql
# OR
yarn add spectaql
```

## Core Capabilities

### 1. **Schema Ingestion Methods**

AI agents can ingest GraphQL schemas from multiple sources:

```javascript
// From live endpoint
const config = {
  introspection: {
    url: 'https://api.example.com/graphql',
    headers: {
      Authorization: 'Bearer YOUR_TOKEN'
    }
  }
}

// From schema file
const config = {
  introspection: {
    schemaFile: './schema.graphql'
  }
}

// From introspection result
const config = {
  introspection: {
    introspectionFile: './introspection.json'
  }
}
```

### 2. **Documentation Generation**

Generate comprehensive documentation with a single command:

```bash
# CLI usage
spectaql --config config.yml

# Programmatic usage
const { run } = require('spectaql')
const result = await run(config)
```

### 3. **Customization Options**

AI agents can customize documentation appearance and behavior:

```yaml
spectaql:
  # Branding
  logoFile: ./logo.png
  faviconFile: ./favicon.ico
  logoHeightPx: 24
  
  # Output options
  targetDir: ./docs
  embeddable: false
  oneFile: true
  
  # Theme customization
  themeDir: ./custom-theme
```

## Common Use Cases for AI Agents

### 1. **API Documentation Automation**

```javascript
// Automatically generate docs for multiple APIs
const apis = [
  { name: 'User API', url: 'https://users.example.com/graphql' },
  { name: 'Product API', url: 'https://products.example.com/graphql' }
]

for (const api of apis) {
  const config = {
    spectaql: {
      targetDir: `./docs/${api.name}`,
      logoFile: `./logos/${api.name}.png`
    },
    introspection: {
      url: api.url,
      headers: { Authorization: 'Bearer TOKEN' }
    },
    info: {
      title: `${api.name} Reference`,
      description: `API documentation for ${api.name}`
    }
  }
  
  await run(config)
}
```

### 2. **Schema Validation and Documentation**

```javascript
// Generate docs and validate schema
const config = {
  introspection: {
    schemaFile: './schema.graphql',
    removeTrailingPeriodFromDescriptions: true
  },
  extensions: {
    graphqlScalarExamples: true
  }
}

try {
  const result = await run(config)
  console.log('Documentation generated successfully')
  console.log('Schema is valid and well-documented')
} catch (error) {
  console.error('Schema validation failed:', error.message)
}
```

### 3. **Multi-Environment Documentation**

```yaml
# Generate docs for different environments
servers:
  - url: https://staging.example.com/graphql
    description: Staging Environment
  - url: https://example.com/graphql
    description: Production Environment
    production: true
    headers:
      - name: Authorization
        example: Bearer <YOUR_TOKEN_HERE>
```

### 4. **Custom Examples and Metadata**

```javascript
// Add custom examples and metadata
const config = {
  introspection: {
    metadataFile: './metadata.json',
    dynamicExamplesProcessingModule: './custom-examples.js'
  }
}

// metadata.json
{
  "User": {
    "fields": {
      "email": {
        "examples": ["user@example.com", "admin@company.com"]
      }
    }
  }
}
```

## Configuration Best Practices

### 1. **Minimal Working Configuration**

```yaml
spectaql:
  targetDir: ./docs
  logoFile: ./logo.png

introspection:
  url: https://api.example.com/graphql
  headers:
    - name: Authorization
      example: Bearer <YOUR_TOKEN_HERE>

info:
  title: API Reference
  description: Complete API documentation
```

### 2. **Advanced Configuration**

```yaml
spectaql:
  targetDir: ./docs
  embeddable: false
  oneFile: false
  themeDir: ./custom-theme
  scrollPaddingTopPx: 60

introspection:
  url: https://api.example.com/graphql
  removeTrailingPeriodFromDescriptions: true
  queryNameStrategy: capitalizeFirst
  fieldExpansionDepth: 3
  spectaqlDirective:
    enable: true

extensions:
  graphqlScalarExamples: true

info:
  title: GraphQL API Reference
  description: Comprehensive API documentation
  termsOfService: https://example.com/terms
  contact:
    name: API Support
    email: support@example.com
  x-introItems:
    - title: Getting Started
      description: Check out our [quickstart guide](https://docs.example.com/quickstart)
```

## Error Handling and Troubleshooting

### 1. **Common Issues**

```javascript
// Handle authentication errors
try {
  const result = await run(config)
} catch (error) {
  if (error.message.includes('401')) {
    console.error('Authentication failed. Check your API token.')
  } else if (error.message.includes('introspection')) {
    console.error('Schema introspection failed. Check the GraphQL endpoint.')
  }
}
```

### 2. **Validation and Testing**

```javascript
// Test configuration before generating
const validateConfig = (config) => {
  if (!config.introspection.url && !config.introspection.schemaFile) {
    throw new Error('Must provide either URL or schema file')
  }
  
  if (!config.spectaql.targetDir) {
    throw new Error('Target directory is required')
  }
  
  return true
}
```

## Integration Examples

### 1. **CI/CD Pipeline Integration**

```yaml
# .github/workflows/docs.yml
name: Generate API Documentation
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install -g spectaql
      - run: spectaql --config docs-config.yml
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

### 2. **Programmatic Integration**

```javascript
// Integrate with existing documentation systems
const { run } = require('spectaql')
const fs = require('fs')

async function updateDocs() {
  const config = {
    spectaql: {
      targetDir: './temp-docs',
      embeddable: true
    },
    introspection: {
      url: process.env.GRAPHQL_ENDPOINT,
      headers: {
        Authorization: `Bearer ${process.env.API_TOKEN}`
      }
    }
  }
  
  const result = await run(config)
  
  // Read the generated HTML
  const html = fs.readFileSync('./temp-docs/index.html', 'utf8')
  
  // Extract just the body content for embedding
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  const bodyContent = bodyMatch ? bodyMatch[1] : html
  
  // Update existing documentation
  fs.writeFileSync('./existing-docs/api-reference.html', bodyContent)
  
  // Clean up
  fs.rmSync('./temp-docs', { recursive: true })
}
```

## Performance and Optimization

### 1. **Large Schema Handling**

```yaml
# Optimize for large schemas
introspection:
  fieldExpansionDepth: 2  # Limit field expansion
  removeTrailingPeriodFromDescriptions: true
  spectaqlDirective:
    enable: true  # Use directives for better control
```

### 2. **Caching and Incremental Updates**

```javascript
// Implement caching for large schemas
const cacheFile = './schema-cache.json'
let cachedSchema = null

if (fs.existsSync(cacheFile)) {
  cachedSchema = JSON.parse(fs.readFileSync(cacheFile, 'utf8'))
}

const config = {
  introspection: {
    introspectionFile: cachedSchema ? cacheFile : undefined,
    url: cachedSchema ? undefined : 'https://api.example.com/graphql'
  }
}
```

## Best Practices for AI Agents

### 1. **Configuration Management**

- Store sensitive information (API tokens) in environment variables
- Use configuration files for different environments
- Validate configuration before execution

### 2. **Error Handling**

- Implement comprehensive error handling for network issues
- Provide clear error messages for configuration problems
- Log all operations for debugging

### 3. **Output Management**

- Organize generated documentation in logical directory structures
- Implement versioning for documentation updates
- Clean up temporary files after generation

### 4. **Integration**

- Use embeddable mode for integrating into existing sites
- Implement webhook notifications for documentation updates
- Provide status reporting for CI/CD pipelines

## Conclusion

SpectaQL provides AI agents with a powerful tool for automating GraphQL API documentation generation. By following these guidelines, agents can create comprehensive, up-to-date documentation that enhances developer experience and reduces maintenance overhead.

For more advanced features and customization options, refer to the [SpectaQL documentation](https://github.com/anvilco/spectaql) and explore the examples in the `/examples` directory.

---

*This guide is designed to help AI agents effectively use SpectaQL for automated GraphQL API documentation generation.*
