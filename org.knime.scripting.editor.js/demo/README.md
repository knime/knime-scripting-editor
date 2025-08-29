# Scripting Editor Demo

This demo allows you to develop and test UI elements for the KNIME Scripting Editor without needing to link to external projects or rebuild constantly.

## Features

- **Live Development**: See changes immediately without npm linking or rebuilds
- **Mocked Backend**: All backend communication is mocked for standalone development
- **Full ScriptingEditor**: Complete implementation with all panes and functionality
- **Realistic Data**: Sample input/output tables, flow variables, and functions
- **Interactive Console**: Mock console output that responds to script execution

## Getting Started

1. **Install dependencies** (if not already done):

   ```bash
   npm install
   ```

2. **Start the demo**:

   ```bash
   npm run demo
   ```

3. **Open your browser** to [http://localhost:3000](http://localhost:3000)

## What's Included

### ScriptingEditor Components

- Main editor with Monaco editor (Python syntax highlighting)
- Left pane with input/output items and flow variables
- Right pane with sample function catalog and variables
- Bottom pane with console output
- Top header with menu items and settings

### Mock Services

- **ScriptingService**: Handles script execution, language server connection, AI suggestions
- **InitialDataService**: Provides sample input data, flow variables, and configurations
- **SettingsService**: Manages node settings and flow variable overrides

### Sample Data

- Input table with 4 columns (Number, String, weird type, Date)
- Flow variables with different types
- Mock function catalog for the right pane
- Console output simulation

## Customizing the Demo

### Adding New UI Components

1. Add your component to the `demo/App.vue` file
2. Use the existing slots in ScriptingEditor:
   - `#left-pane` - Custom left sidebar content
   - `#right-pane` - Custom right sidebar content
   - `#code-editor-controls` - Buttons above the editor
   - `#bottom-pane-status-label` - Status information
   - Custom bottom tabs via `additionalBottomPaneTabContent`

### Modifying Mock Data

Edit `demo/mock-data.ts` to change:

- Input table structure and data
- Flow variables
- Initial script content
- Port configurations

### Adding Mock Backend Responses

Edit `demo/mock-services.ts` to add new mock responses:

```typescript
const scriptingService = createScriptingServiceMock({
  sendToServiceMockResponses: {
    myNewMethod: async (args) => {
      // Your mock implementation
      return { result: "success" };
    },
  },
});
```

## Development Tips

- **Hot Reload**: Changes to demo files trigger automatic browser refresh
- **Console Logging**: All service calls are logged to browser console
- **Error Handling**: TypeScript errors show up in the terminal and browser
- **Styling**: Use `@knime/styles/css` for consistent KNIME styling

## File Structure

```
demo/
├── App.vue          # Main demo application
├── main.ts          # Demo entry point
├── mock-data.ts     # Sample data for the editor
└── mock-services.ts # Mock backend services

demo.html            # HTML entry point
vite.demo.config.ts  # Vite configuration for demo
```

## Troubleshooting

### Port Already in Use

If port 3000 is busy, you can change it in `vite.demo.config.ts`:

```typescript
server: {
  port: 3001, // Change to any available port
}
```

### TypeScript Errors

Make sure all peer dependencies are installed as dev dependencies in package.json:

- `@knime/components`
- `@knime/ui-extension-service`
- `monaco-editor`
- `vue`

### Missing Icons

The demo uses emoji icons for simplicity. For real development, import SVG icons from `@knime/styles/img/icons/`
