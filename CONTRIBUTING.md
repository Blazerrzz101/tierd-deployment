# Contributing to Tier'd

First off, thank you for considering contributing to Tier'd! It's people like you that make Tier'd such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [conduct@tierd.com](mailto:conduct@tierd.com).

## Development Process

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Pull Request Process

1. Update the README.md with details of changes to the interface, if applicable.
2. Update the documentation with details of any changes to the functionality.
3. The PR title should be descriptive and follow the format: `[Type] Description`
   - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
   - Example: `[feat] Add product mention suggestions`
4. Include relevant issue numbers in the PR description.
5. Ensure all tests pass and add new tests for new features.
6. Get at least one review approval before merging.

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

3. Run database migrations:
   ```bash
   supabase db reset
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Development Guidelines

#### Code Style

- Follow the existing code style
- Use TypeScript for all new code
- Use ESLint and Prettier for code formatting
- Keep functions small and focused
- Write meaningful variable and function names
- Add JSDoc comments for complex functions

#### Testing

1. Write tests for all new features:
   ```bash
   npm test
   ```

2. Ensure all tests pass before submitting PR:
   ```bash
   npm run test:ci
   ```

3. Add both unit and integration tests where applicable

4. Test coverage should not decrease

#### TypeScript Guidelines

- Use strict mode
- Define interfaces for all data structures
- Use proper type annotations
- Avoid `any` type unless absolutely necessary
- Use generics where appropriate

#### Component Guidelines

1. File Structure:
   ```typescript
   // components/MyComponent.tsx
   import { useState } from 'react'
   import type { MyComponentProps } from '@/types'
   
   export function MyComponent({ prop1, prop2 }: MyComponentProps) {
     // Implementation
   }
   ```

2. Props Interface:
   ```typescript
   // types/index.ts
   export interface MyComponentProps {
     prop1: string
     prop2?: number
     children?: React.ReactNode
   }
   ```

3. Use functional components with hooks
4. Keep components focused and reusable
5. Use proper prop types and validation
6. Add meaningful comments and documentation

#### Database Guidelines

1. Always use migrations for schema changes
2. Follow naming conventions:
   - Tables: plural, snake_case
   - Columns: snake_case
   - Foreign keys: `table_name_id`
3. Add appropriate indexes
4. Use proper constraints
5. Document complex queries
6. Test migrations both up and down

#### Security Guidelines

1. Never commit sensitive data
2. Use environment variables for secrets
3. Implement proper input validation
4. Follow security best practices
5. Use proper authentication checks
6. Implement rate limiting where needed

## Reporting Bugs

1. Use the GitHub issue tracker
2. Check if the issue already exists
3. Include:
   - Clear title and description
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots if applicable
   - Environment details

## Feature Requests

1. Use the GitHub issue tracker
2. Check if the feature has been requested
3. Include:
   - Clear title and description
   - Use case
   - Proposed solution
   - Alternative solutions considered
   - Additional context

## Review Process

1. All code changes require review
2. Reviewers should focus on:
   - Code quality
   - Test coverage
   - Security implications
   - Performance impact
   - Documentation
3. Use constructive feedback
4. Address all review comments

## Release Process

1. Version numbers follow [SemVer](http://semver.org/)
2. Create a release branch
3. Update version numbers
4. Update CHANGELOG.md
5. Create a GitHub release
6. Deploy to staging
7. Deploy to production

## Questions?

Feel free to:
- Open an issue
- Join our [Discord community](https://discord.gg/tierd)
- Email the maintainers at [dev@tierd.com](mailto:dev@tierd.com)

## License

By contributing, you agree that your contributions will be licensed under the MIT License. 