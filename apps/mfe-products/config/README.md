# Config Directory

All configuration files for the Products MFE are organized in this directory.

## Files

### Testing Configuration
- **jest.config.ts** - Jest test runner configuration
- **jest.setup.ts** - Jest setup and global mocks

### Build & Styling Configuration
- **tailwind.config.ts** - Tailwind CSS configuration
- **postcss.config.js** - PostCSS configuration for CSS processing

## Usage

All configurations are automatically loaded by their respective tools:
- Jest: Uses `--config config/jest.config.ts` in package.json scripts
- Tailwind/PostCSS: Referenced via wrapper configs at project root
- Next.js: Configuration remains at root (next.config.js)

## Notes

- Root wrappers (tailwind.config.js, postcss.config.js) delegate to config/ directory
- This keeps the project root clean while maintaining tool compatibility
- TypeScript configs (tsconfig.json) remain at root for IDE integration
