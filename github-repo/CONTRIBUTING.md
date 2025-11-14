# Contributing to SignLess

Thank you for your interest in contributing to SignLess. This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain professionalism

## How to Contribute

### Reporting Issues

Before creating an issue:
1. Search existing issues to avoid duplicates
2. Provide clear reproduction steps
3. Include relevant error messages and logs
4. Specify your environment (Node version, OS, etc.)

### Suggesting Features

Feature requests should include:
- Clear use case description
- Expected behavior
- Alternative solutions considered
- Potential implementation approach

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Write or update tests if applicable
5. Update documentation
6. Commit with clear messages
7. Push to your fork
8. Open a pull request

## Development Setup

```bash
git clone https://github.com/yourusername/signless.git
cd signless
npm install
cp .env.example .env
# Configure .env with your settings
npm start
```

## Code Style

- Use consistent indentation (2 spaces)
- Follow existing code patterns
- Add comments for complex logic
- Keep functions focused and small
- Use meaningful variable names
- Avoid unnecessary dependencies

## Testing

Before submitting:
- Test all API endpoints
- Verify authentication flow works
- Check error handling
- Test with different wallets
- Verify CORS configuration

## Documentation

Update documentation when:
- Adding new features
- Changing API behavior
- Modifying configuration options
- Fixing bugs that affect usage

Files to update:
- README.md - Overview and basic usage
- API.md - API endpoint changes
- QUICKSTART.md - Setup process changes
- DEPLOYMENT.md - Deployment-related changes

## Commit Messages

Format:
```
type: brief description

Detailed explanation if needed
```

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes (formatting)
- refactor: Code refactoring
- test: Test additions or changes
- chore: Maintenance tasks

Examples:
```
feat: add rate limiting to auth endpoints

Implements express-rate-limit with configurable
limits per IP address to prevent abuse.

fix: correct amount verification tolerance

Changes tolerance from 0.0001 to 0.000001 SOL
to match dynamic amount precision.
```

## Release Process

Maintainers handle releases:
1. Update version in package.json
2. Update CHANGELOG.md
3. Create GitHub release
4. Tag version
5. Deploy to production

## Questions

For questions about contributing:
- Open a GitHub discussion
- Review existing documentation
- Check closed issues for similar questions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
