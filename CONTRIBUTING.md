# Contributing to PipelineIQ

Thank you for contributing to PipelineIQ! Please review the guidelines below to set up your environment, follow code conventions, and submit PRs.

## Local Setup

1.  Clone the repository and enter the directory:
    ```bash
    git clone https://github.com/you/pipeline-iq.git
    cd pipeline-iq
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up the database:
    ```bash
    npx prisma generate
    npx prisma db push
    npx prisma db seed
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```

## Development Workflow

*   **Branch Naming**: Use clean, descriptive branch names prefixed by task type:
    *   `feat/add-deal-filters`
    *   `fix/session-fixation-login`
    *   `docs/architecture-diagram`
*   **Commit Style**: Follow Conventional Commits format (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`). Keep commits small, atomic, and meaningful.
*   **Testing**: Ensure all tests compile and pass successfully before opening a PR:
    ```bash
    npm run test
    ```
*   **Linting**: Verify that the code conforms to ESLint rules:
    ```bash
    npm run lint
    ```
