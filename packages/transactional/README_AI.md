# transactional

## responsibilities
- Maintain data, types, and layouts for generating transactional emails.
- Centralize the visual aspect of the templates to ensure visual consistency across the system.

## rules
- Do not process sending logic (like AWS, Resend), leaving that to the API's services layer. Focus solely on the layout.
- Build email components in a reusable way.
- Expose templates as pure functions or components (e.g., React Email) that accept "props".

## examples
- `WelcomeEmail(props: { name: string, link: string })` for new users.
- `ResetPasswordEmail(props: { token: string })`.
