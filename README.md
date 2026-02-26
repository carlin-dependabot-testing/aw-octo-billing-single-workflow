# Octo Billing Demo Application

⚠️ **WARNING: This is a deliberately vulnerable application for demonstration purposes only. Do NOT use in production!**

## Overview

This is a demo Node.js billing application that contains intentionally vulnerable dependencies and security issues. It's designed for:

- Security vulnerability demonstrations
- Container scanning testing
- Supply chain security education
- CI/CD pipeline security testing

## Vulnerabilities Included

This application includes multiple known vulnerabilities through outdated dependencies:

### High-Risk Dependencies
- `express@4.16.0` - Multiple known vulnerabilities
- `lodash@4.17.4` - Prototype pollution vulnerabilities
- `moment@2.19.3` - Regular expression DoS vulnerabilities
- `mongoose@5.0.0` - Various security issues
- `handlebars@4.0.12` - Template injection vulnerabilities
- `ejs@2.5.7` - Code injection vulnerabilities
- `jwt-simple@0.5.1` - Algorithm confusion vulnerabilities
- `marked@0.5.0` - XSS vulnerabilities
- `serialize-javascript@1.5.0` - XSS vulnerabilities
- `tar@4.4.6` - Path traversal vulnerabilities
- `axios@0.18.0` - Various security issues
- And many more...

### Container Vulnerabilities
- Using `node:16-alpine` base image with known CVEs
- Running as non-root user (good practice, but base image still vulnerable)

## Features

- RESTful API for user management
- Billing and payment processing
- Web interface with Bootstrap styling
- Docker containerization
- GitHub Actions CI/CD pipeline with security scanning
- Jest testing framework

## API Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/users` - List all users
- `POST /api/users` - Create a new user
- `GET /api/bills` - List all bills
- `POST /api/bills` - Create a new bill
- `POST /api/payments` - Process a payment

## Running the Application

### Local Development

```bash
# Install dependencies (this will install vulnerable packages!)
npm install

# Start the development server
npm run dev

# Run tests
npm test
```

### Docker

```bash
# Build the container
docker build -t octo-billing .

# Run the container
docker run -p 3000:3000 octo-billing
```

### GitHub Actions

The repository includes a comprehensive CI/CD pipeline that:

1. **Security Scanning**: Runs Trivy vulnerability scans on the repository
2. **Build & Test**: Installs dependencies and runs tests
3. **Container Build**: Builds and pushes Docker images to GitHub Container Registry
4. **Container Scanning**: Scans the built container for vulnerabilities
5. **Deployment**: Simulated deployment to production

## Security Scanning Results

When you run security scanners on this project, you should expect to find:

- **High severity** vulnerabilities in multiple dependencies
- **Critical** vulnerabilities in some packages
- **Medium/Low** severity issues across various components
- Container base image vulnerabilities

## Educational Use Cases

This repository is perfect for demonstrating:

1. **Dependency Scanning**: How tools like `npm audit`, Snyk, or GitHub Dependabot identify vulnerable packages
2. **Container Scanning**: How tools like Trivy, Clair, or Twistlock detect container vulnerabilities
3. **Supply Chain Security**: The importance of keeping dependencies up to date
4. **CI/CD Security**: Integrating security scanning into build pipelines
5. **Vulnerability Management**: Prioritizing and addressing security issues

## Remediation Examples

To fix the vulnerabilities, you would typically:

1. **Update Dependencies**: Run `npm update` or manually update package.json versions
2. **Use Audit Tools**: Run `npm audit --fix` to automatically fix known issues
3. **Update Base Images**: Use newer, patched container base images
4. **Implement Security Policies**: Use tools like Renovate or Dependabot for automated updates

## Contributing

This is a demo repository. If you want to add more vulnerable dependencies or improve the demonstration value, feel free to submit a pull request!

## Disclaimer

🚨 **IMPORTANT**: This application contains known security vulnerabilities and should never be deployed to a production environment or exposed to the internet. It is intended solely for educational and testing purposes.

## License

MIT License - See LICENSE file for details.
