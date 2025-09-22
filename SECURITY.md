# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

The Warframe Market Analytics team takes security bugs seriously. We appreciate your efforts to responsibly disclose your findings, and will make every effort to acknowledge your contributions.

### How to Report a Security Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: [security@warframe-analytics.com](mailto:security@warframe-analytics.com)

If you prefer, you can also create a private security advisory through GitHub's security advisory feature.

### What to Include in Your Report

To help us understand and resolve the issue quickly, please include:

1. **Description of the vulnerability**
2. **Steps to reproduce** the issue
3. **Potential impact** of the vulnerability
4. **Suggested fix** (if you have one)
5. **Your contact information** for follow-up questions

### Response Timeline

- **Initial Response**: Within 48 hours
- **Detailed Response**: Within 7 days
- **Fix Timeline**: Varies based on severity (24 hours to 30 days)

### Severity Classification

| Severity | Description | Response Time |
|----------|-------------|---------------|
| Critical | Remote code execution, data breach | 24 hours |
| High | Privilege escalation, authentication bypass | 72 hours |
| Medium | Information disclosure, CSRF | 1 week |
| Low | Minor information leaks | 2 weeks |

## Security Best Practices

### For Users

1. **Keep Dependencies Updated**: Regularly update to the latest version
2. **Secure Configuration**: Follow the security guidelines in README.md
3. **Environment Variables**: Never commit `.env` files to version control
4. **Database Security**: Use strong passwords and restrict database access
5. **Proxy Security**: Validate proxy sources and rotate credentials regularly

### For Developers

1. **Input Validation**: Always validate and sanitize user inputs
2. **Authentication**: Implement proper authentication mechanisms
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Logging**: Log security events but avoid logging sensitive data
5. **Dependencies**: Regularly audit and update dependencies

## Common Security Considerations

### API Security

- Use HTTPS in production
- Implement proper CORS policies
- Validate all API inputs
- Use authentication tokens with appropriate expiration
- Implement rate limiting

### Database Security

- Use parameterized queries to prevent SQL injection
- Implement proper access controls
- Encrypt sensitive data at rest
- Regular backup and recovery testing
- Monitor for unusual database activity

### Proxy Security

- Validate proxy sources
- Rotate proxy credentials regularly
- Monitor proxy usage for abuse
- Implement failover mechanisms
- Log proxy-related security events

## Vulnerability Disclosure Timeline

1. **Day 0**: Vulnerability reported
2. **Day 1-7**: Initial assessment and acknowledgment
3. **Day 7-30**: Investigation and fix development
4. **Day 30**: Fix released (may be extended for complex issues)
5. **Day 30+**: Public disclosure (coordinated with reporter)

## Security Updates

Security updates will be clearly marked in:
- Release notes
- GitHub security advisories
- Project documentation
- Email notifications (if applicable)

## Acknowledgments

We thank the following security researchers for their responsible disclosure:

<!-- This section will be updated as reports are received -->

## Contact

For security-related questions or concerns, please contact:
- Email: security@warframe-analytics.com
- GitHub: Create a private security advisory

## Legal

By reporting a vulnerability, you agree to:
- Not access or modify data belonging to others
- Not perform actions that could harm the service or users
- Provide reasonable time for the issue to be resolved
- Not publicly disclose the vulnerability until it's been addressed

We commit to:
- Respond to reports in a timely manner
- Work with you to understand and resolve the issue
- Acknowledge your responsible disclosure publicly (if desired)
- Not pursue legal action for good faith security research
