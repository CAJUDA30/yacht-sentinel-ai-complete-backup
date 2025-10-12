# React DevTools Installation Guide

## Overview
React DevTools is a browser extension that provides debugging utilities for React applications. It helps with inspecting React components, state management, and performance profiling.

## Installation Instructions

### For Chrome/Chromium Browsers
1. Visit the [Chrome Web Store](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
2. Click "Add to Chrome"
3. Confirm the installation

### For Firefox
1. Visit the [Firefox Add-ons Store](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)
2. Click "Add to Firefox"
3. Confirm the installation

### For Edge
1. Visit the [Microsoft Edge Add-ons Store](https://microsoftedge.microsoft.com/addons/detail/react-developer-tools/gpphkfbcpidddadnkolkpfckpihlkkil)
2. Click "Get"
3. Confirm the installation

## Benefits for Yacht Sentinel AI Development

### Component Inspection
- View React component hierarchy
- Inspect props and state in real-time
- Debug component re-renders

### Performance Profiling
- Profile component render times
- Identify performance bottlenecks
- Optimize React application performance

### State Management
- Debug Redux/Context state changes
- Track state mutations
- Inspect custom hooks

## Usage in Yacht Sentinel AI

### Development Mode Detection
The console message you see indicates that React DevTools is not installed. Once installed, the warning will disappear and you'll have access to:

1. **Component Tree**: Inspect the yacht management components
2. **Props/State**: Debug AI provider configurations
3. **Performance**: Profile complex operations like document processing
4. **Hooks**: Debug custom hooks for authentication and data fetching

### Accessing DevTools
1. Open your browser's Developer Tools (F12)
2. Look for "⚛️ Components" and "⚛️ Profiler" tabs
3. These tabs will only appear when React DevTools is installed and you're viewing a React application

## Security Note
React DevTools only works in development mode and does not affect production builds. It's safe to install and will not impact the performance or security of your production application.

## Alternative: Standalone React DevTools
For development without a browser extension, you can also use the standalone version:

```bash
npm install -g react-devtools
react-devtools
```

This opens a standalone window that can connect to your development server.

## Troubleshooting
- **DevTools not appearing**: Ensure you're running in development mode
- **Can't see components**: Make sure React DevTools version is compatible with your React version
- **Performance issues**: Disable DevTools in production builds (this happens automatically)

The React DevTools will significantly improve your development experience with the Yacht Sentinel AI application!