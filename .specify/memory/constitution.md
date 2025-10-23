<!--
========================================
CONSTITUTION SYNC IMPACT REPORT
========================================
Version Change: 1.0.0 → 1.1.0
Change Type: MINOR (New principle added)

Modified Principles:
- NEW: V. Documentation Language (Traditional Chinese)

Added Sections:
- None (new principle added to existing Core Principles section)

Removed Sections:
- None

Templates Requiring Updates:
✅ plan-template.md - Already supports documentation requirements
✅ spec-template.md - User-facing specs will now use Traditional Chinese
✅ tasks-template.md - Task descriptions remain in English, but deliverables follow language principle
⚠️ No command files found in .specify/templates/commands/ - skipped

Follow-up TODOs:
- Team should review and translate existing English documentation to Traditional Chinese if applicable
- Consider adding language linting tools to verify Traditional Chinese compliance

Rationale for MINOR version (1.1.0):
- Adding a new principle (V. Documentation Language)
- Does not break or redefine existing principles
- Materially expands governance guidance with new language requirements
- Backward compatible - existing English docs grandfathered until migration

Changes Summary:
- Added Principle V: Documentation Language requirement for Traditional Chinese (zh-TW)
- Updated Documentation Requirements section to clarify language scope
- Updated Pre-Merge Gates to include language compliance check

Last Updated: 2025-10-23
========================================
-->

# Project Constitution

## Core Principles

### I. Code Quality & Maintainability

**Principle**: All code MUST prioritize readability, maintainability, and simplicity over cleverness or premature optimization.

**Requirements**:
- Code MUST be self-documenting with clear naming conventions
- Functions MUST have a single, well-defined responsibility
- Complexity MUST be justified in writing (see Complexity Tracking in plan.md)
- Code reviews MUST verify adherence to project style guidelines
- Technical debt MUST be documented and tracked explicitly
- Refactoring MUST be treated as a first-class engineering activity

**Rationale**: Maintainable code reduces long-term costs, enables team scalability, and prevents architectural decay. Code is read 10x more than it is written; optimize for the reader.

### II. Testing Standards (NON-NEGOTIABLE)

**Principle**: Test-first development is mandatory. All features MUST have comprehensive test coverage before production deployment.

**Requirements**:
- **Test-Driven Development (TDD)**: Tests MUST be written first, verified to fail, then implementation follows (Red-Green-Refactor cycle)
- **Test Coverage Levels**:
  - **Contract Tests**: MUST exist for all public APIs, library interfaces, and service boundaries
  - **Integration Tests**: MUST cover all user stories and cross-component interactions
  - **Unit Tests**: SHOULD cover business logic and edge cases (recommended but not blocking)
- **Test Quality**: Tests MUST be deterministic, isolated, fast, and maintainable
- **Continuous Validation**: All tests MUST pass before merge; failing tests block deployment

**Rationale**: Testing first ensures features are designed for testability, catches defects early, provides living documentation, and enables confident refactoring. This is non-negotiable because untested code is a liability.

### III. User Experience Consistency

**Principle**: User experiences MUST be consistent, predictable, and delightful across all touchpoints.

**Requirements**:
- **Design System**: All UI components MUST follow a unified design system with documented patterns
- **Accessibility**: MUST meet WCAG 2.1 Level AA standards minimum
- **Error Handling**: Error messages MUST be user-friendly, actionable, and consistent in tone
- **Response Feedback**: Users MUST receive immediate feedback for all actions (loading states, confirmations, progress indicators)
- **Cross-Platform Consistency**: Shared features MUST behave identically across web, mobile, and API interfaces
- **User Story Validation**: Every user story MUST be independently testable and deliver standalone value

**Rationale**: Consistent UX reduces cognitive load, builds user trust, improves accessibility, and directly impacts user satisfaction and retention metrics.

### IV. Performance Requirements

**Principle**: Performance is a feature. All components MUST meet defined performance budgets and be monitored continuously.

**Requirements**:
- **Performance Budgets**: Every feature MUST define performance targets upfront (response time, throughput, resource usage)
- **Mandatory Metrics**:
  - API endpoints: p95 latency < 200ms, p99 < 500ms
  - Page load time: First Contentful Paint < 1.5s, Time to Interactive < 3.5s
  - Memory footprint: MUST NOT exceed defined limits per service
- **Performance Testing**: Load and stress tests REQUIRED for all new features handling user data
- **Monitoring & Alerting**: Production metrics MUST be tracked with automatic alerting on threshold violations
- **Optimization**: Performance regressions blocking merge; improvements tracked and celebrated

**Rationale**: Performance directly impacts user experience, operational costs, and scalability. Setting budgets upfront prevents performance debt and ensures features are designed efficiently from the start.

### V. Documentation Language

**Principle**: All specifications, plans, and user-facing documentation MUST be written in Traditional Chinese (zh-TW) to ensure consistency and accessibility for the target audience.

**Requirements**:
- **Feature Specifications** (`spec.md`): MUST be written in Traditional Chinese
- **Implementation Plans** (`plan.md`): MUST be written in Traditional Chinese
- **User-Facing Documentation**: All user guides, help text, UI strings, error messages, and README files MUST use Traditional Chinese
- **API Documentation**: Public API documentation MUST be available in Traditional Chinese
- **Release Notes**: MUST be written in Traditional Chinese
- **Code Comments**: SHOULD prioritize Traditional Chinese for business logic explanations; English acceptable for technical/framework-specific comments
- **Exemptions**:
  - Source code (variable names, function names) MAY use English for technical interoperability
  - Internal development task descriptions MAY use English for tooling compatibility
  - Third-party dependencies and configuration files follow their respective conventions

**Rationale**: Language consistency ensures all stakeholders—product managers, developers, designers, and end users—can fully understand project requirements, implementation details, and user experiences without language barriers. Traditional Chinese as the primary documentation language aligns with the target user base and organizational context.

## Development Workflow

**Pull Request Requirements**:
- All PRs MUST reference a user story or documented requirement
- Code reviews MUST verify constitution compliance
- All automated tests MUST pass (contract, integration, and unit if present)
- Performance benchmarks MUST meet or exceed baseline
- User-facing documentation MUST be in Traditional Chinese

**Branching Strategy**:
- Feature branches MUST follow naming convention: `###-feature-name`
- Main branch MUST always be deployable
- Merge ONLY after all quality gates pass

**Documentation Requirements**:
- Public APIs MUST have contract documentation in Traditional Chinese
- Complex algorithms MUST include inline rationale comments (Traditional Chinese preferred, English acceptable)
- Architecture decisions MUST be captured in ADRs (Architecture Decision Records) in Traditional Chinese
- All specifications (spec.md, plan.md) MUST be in Traditional Chinese

## Quality Gates

**Pre-Development Gates**:
- [ ] User stories defined with acceptance criteria (in Traditional Chinese)
- [ ] Performance targets established
- [ ] Testing strategy documented
- [ ] Constitution compliance review completed

**Pre-Merge Gates**:
- [ ] All tests passing (contract, integration, unit)
- [ ] Code review approved by at least one team member
- [ ] Performance budgets met or explicitly waived with justification
- [ ] Documentation updated (API docs, user guides, ADRs) in Traditional Chinese
- [ ] Accessibility standards verified
- [ ] No new technical debt introduced without tracking
- [ ] Language compliance verified (Traditional Chinese for user-facing content)

**Pre-Production Gates**:
- [ ] All user stories independently tested and validated
- [ ] Load testing completed for high-traffic features
- [ ] Monitoring and alerting configured
- [ ] Rollback plan documented
- [ ] User-facing text verified as Traditional Chinese

## Governance

**Constitution Authority**:
- This constitution supersedes all other development practices and guidelines
- In case of conflict between this document and other policies, the constitution takes precedence
- Violations MUST be flagged in code reviews and addressed before merge

**Amendment Process**:
- Amendments require written proposal with rationale
- Major changes (principle additions/removals) require team consensus
- All amendments MUST include migration plan for existing code
- Version bumps follow semantic versioning (MAJOR.MINOR.PATCH)

**Compliance & Review**:
- All PRs MUST include constitution compliance check
- Quarterly constitution review meetings to assess effectiveness
- Complexity exceptions MUST be documented in plan.md Complexity Tracking section
- Continuous improvement: Teams SHOULD propose amendments based on lessons learned

**Living Document**:
- Constitution evolves with the project
- Feedback loop: retrospectives inform constitutional amendments
- Principles are living guidelines, not rigid rules—but deviations MUST be justified

**Version**: 1.1.0 | **Ratified**: 2025-10-23 | **Last Amended**: 2025-10-23
