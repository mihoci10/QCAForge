# QCAForge 
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Build and Test](https://github.com/mihoci10/QCAForge/actions/workflows/ci.yaml/badge.svg)](https://github.com/mihoci10/QCAForge/actions/workflows/ci.yaml)

**QCAForge** is a modern desktop application for designing and simulating Quantum Cellular Automata (QCA) circuits. Built with Tauri, Svelte, and Rust, it provides a comprehensive environment for QCA research, design, and analysis.

## Features

### 🔬 **QCA Design & Simulation**
- Interactive visual QCA circuit designer
- Support for various cell architectures
- Integrated simulation engine powered by the [QCASim](https://github.com/mihoci10/QCASim) library
- Real-time simulation progress tracking

### 📊 **Analysis & Visualization**
- Comprehensive simulation result analysis with multiple visualization options
- Truth table analysis
- Data export capabilities

## Installation & Development

### Prerequisites
- **Node.js** (v18 or higher)
- **Rust** (latest stable)
- **Git**

### Setup Development Environment

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mihoci10/QCAForge.git
   cd QCAForge
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run tauri dev
   ```
   This will launch the application in development mode with hot-reload enabled.

### Building for Production

```bash
# Build the web frontend
npm run build

# Build the complete desktop application
npm run tauri build
```

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

### Development Guidelines
- Follow TypeScript/JavaScript best practices
- Use Rust formatting standards (`cargo fmt`)
- Write tests for new functionality
- Update documentation as needed

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Contact

For questions, suggestions, or support, please open an issue on GitHub or contact the maintainers.
