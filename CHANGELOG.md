# Changelog

## [4.0.0] - 2026-07-15

### Features
- Full SaaS platform transformation with user authentication and RBAC
- 30+ chemistry calculators covering thermodynamics, kinetics, solution chemistry, quantum mechanics, electrochemistry, gas laws, and more
- Advanced equation balancer with redox, ionic, and hydrated compound support
- Interactive periodic table with heatmap mode and element details
- Molecular structure viewer using SmilesDrawer
- Data visualization engine using Chart.js with dark mode support
- Chemical database search with PubChem integration
- User dashboard with analytics and admin view
- Workspace collaboration with shared calculations
- Batch calculation mode with CSV upload
- Plugin architecture with lifecycle hooks
- Result annotation, star/favorite, and comparison mode
- Docker deployment with multi-stage builds
- REST API with OpenAPI 3.1 documentation
- Material Design 3 design system
- Responsive design (desktop, tablet, mobile)
- Offline indicator and graceful degradation

### Bug Fixes
- Fixed equation balancer rejecting valid equations with large coefficients
- Fixed pre-existing test failures in appNav, script, and dashboard tests

### Documentation
- Comprehensive README update
- OpenAPI 3.1 specification
- Developer guide
- API documentation with Swagger UI

### Infrastructure
- CI/CD pipeline with GitHub Actions
- Docker multi-stage production builds
- Docker Compose for development and production
- Test coverage enforcement (90% lines, 85% branches)
