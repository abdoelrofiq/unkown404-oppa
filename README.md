# @unkown404/oppa

Lightweight Oracle SQL pagination helper for Node.js.

`@unkown404/oppa` is designed to simplify dynamic Oracle SQL query handling with built-in support for pagination, sorting, grouping, filtering, and total row counting.

---

# Features

## Oracle Pagination Support

Built specifically for Oracle Database using modern SQL pagination syntax:

- OFFSET
- FETCH NEXT

Provides clean and efficient paginated query generation.

---

## Dynamic ORDER BY Builder

Generate dynamic sorting clauses safely and consistently.

Supports:

- ASC sorting
- DESC sorting
- Runtime field selection

---

## Dynamic GROUP BY Builder

Create reusable GROUP BY clauses dynamically.

Useful for:

- Aggregation queries
- Reporting systems
- Dashboard statistics

---

## Dynamic Search Filtering

Generate flexible dynamic filtering using SQL LIKE queries.

Supports:

- Multiple searchable fields
- Dynamic field selection
- Runtime filtering

---

## Case Sensitive & Insensitive Search

Supports both:

- Case-sensitive filtering
- Case-insensitive filtering using LOWER()

---

## Include & Exclude Search Fields

Control searchable columns dynamically.

Supports:

- Explicit allowed fields
- Field exclusion lists
- Safe runtime field filtering

---

## Total Row Counter

Automatically generates COUNT queries for pagination metadata.

Useful for:

- Total pages calculation
- Table pagination
- API metadata responses

---

## Express.js Query Integration

Built to work seamlessly with Express.js request query parameters.

Supports automatic extraction for:

- Page
- Row per page
- Sort field
- Sort direction
- Filter fields
- Search parameter

---

## Query Sanitization

Includes internal SQL cleanup utilities for:

- Newline removal
- Duplicate whitespace cleanup
- Query normalization

---

## Lightweight

Minimal dependency footprint.

Only uses:

- lodash

---

## Reusable Query Builder Architecture

Designed with reusable builder methods for scalable backend systems.

Suitable for:

- REST APIs
- Admin dashboards
- Enterprise systems
- Reporting modules

---

# Package Highlights

- Oracle DB focused
- Pagination ready
- Dynamic filtering
- Flexible sorting
- Group by support
- Total row counting
- Express.js friendly
- Lightweight architecture
- Simple integration

---

# License

MIT