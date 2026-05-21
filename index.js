const _ = require("lodash");

/**
 * Class to handle data pagination, sorting, grouping,
 * and dynamic filter clause generation safely for Oracle DB.
 */
class Pagination {
  /** @type {string} Generated ORDER BY SQL clause string */
  sortQuery = "";
  /** @type {string} Generated filter condition string (without WHERE/AND keywords) */
  orFinalStatement = "";
  /** @type {string} Generated GROUP BY SQL clause string */
  groupQuery = "";

  /**
   * @param {Function|null} oraexec - Executor function to run queries against Oracle database.
   * @param {string|null} query - The base/initial SQL query string.
   */
  constructor(oraexec = null, query = null) {
    /** @type {Function|null} */
    this.oraexec = oraexec;
    /** @type {string|null} */
    this.query = query;
  }

  /**
   * Splits a string by a given separator into a clean, trimmed array of strings.
   * @param {string} str - The source string to split.
   * @param {string} separator - The delimiter character (e.g., ",").
   * @returns {string[]} An array of trimmed strings.
   */
  stringToArray = (str, separator) => {
    if (!_.isEmpty(str)) {
      return _.split(str, separator).map(_.trim);
    }
    return [];
  };

  /**
   * Builds the SQL query to calculate the total number of rows (COUNT(*)) using a Subquery Wrapper.
   * @returns {string} Complete SQL query string dedicated to fetching the total row count.
   */
  countQueryBuilder = () => {
    const baseQuery = this._getCleanedQuery().replace(/;$/, "") + this.groupQuery;

    let queryWithFilter = baseQuery;
    if (this.orFinalStatement.length > 0) {
      queryWithFilter = `SELECT * FROM (${baseQuery}) src_f WHERE ${this.orFinalStatement}`;
    }

    return `SELECT COUNT(*) AS TOTAL FROM (${queryWithFilter}) src_cnt`;
  };

  /**
   * Internal helper to sanitize newlines and duplicate whitespaces from the base query.
   * @private
   * @returns {string} The cleaned query string.
   */
  _getCleanedQuery = () => {
    if (!this.query) return "";
    return this.query.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  };

  /**
   * Executes the COUNT query on the Oracle database and returns the total row count.
   * @param {Object} [bind={}] - Oracle query parameter bind object.
   * @returns {Promise<number>} Total number of rows found (returns 0 if empty or failed).
   */
  getTotalRows = async (bind = {}) => {
    const countQuery = this.countQueryBuilder();
    const countQueryResult = await this.oraexec(countQuery, bind);

    return countQueryResult?.rows[0]?.TOTAL ?? 0;
  };

  /**
   * Builds the final paginated SQL query combining filters, groupings, sorting,
   * and Oracle-specific OFFSET/FETCH clauses.
   * @param {number} page - Current page number (1-indexed).
   * @param {number} rowPerPage - Number of data rows per page.
   * @returns {string} The final ready-to-execute paginated SQL query.
   */
  paginatorQueryBuilder = (page, rowPerPage) => {
    const offset = (page - 1) * rowPerPage;
    const limit = rowPerPage;
    const offsetQuery = ` OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;

    const baseQuery = this._getCleanedQuery().replace(/;/g, "");

    let coreQuery = baseQuery + this.groupQuery + this.sortQuery;

    if (this.orFinalStatement.length > 0) {
      coreQuery = `SELECT * FROM (${coreQuery}) src_pg WHERE ${this.orFinalStatement}`;
    }

    return coreQuery + offsetQuery;
  };

  /**
   * Constructs the ORDER BY string clause based on the given field and direction.
   * @param {string} sortField - The column name to sort by.
   * @param {string} direction - The sorting direction ('ASC' or 'DESC').
   * @returns {void}
   */
  sortQueryBuilder = (sortField, direction) => {
    this.sortQuery = ` ORDER BY ${sortField} ${direction}`;
  };

  /**
   * Constructs the GROUP BY string clause based on the given column name.
   * @param {string} field - The column name for data grouping.
   * @returns {void}
   */
  groupByQueryBuilder = (field) => {
    this.groupQuery = ` GROUP BY ${field}`;
  };

  /**
   * Builds a dynamic dynamic 'OR' condition search statement using the LIKE operator.
   * Column field exclusion/matching is evaluated case-insensitively.
   * @param {Object} req - The Express Request object (`req`).
   * @param {string[]|null} [onlyField=null] - Exclusive list of fields to search (ignores request params if provided).
   * @param {string[]|null} [exceptFields=null] - List of fields to be excluded from the search process.
   * @param {boolean} [casesensitive=true] - Determines whether the search values match case-sensitively.
   * @returns {void}
   */
  customFilterQueryBuilder = (req, onlyField = null, exceptFields = null, casesensitive = true) => {
    let param = req?.query?.param ?? "";
    if (!param) {
      this.orFinalStatement = ''
      return;
    }
    if (!casesensitive) {
      param = param.toLowerCase();
    }

    let targetFields = onlyField && Array.isArray(onlyField)
      ? onlyField
      : this.stringToArray(req?.query?.fields ?? "", ",");

    if (exceptFields && Array.isArray(exceptFields)) {
      const excludeList = exceptFields.map(field => String(field).toLowerCase().trim());

      targetFields = targetFields.filter((field) => {
        const cleanFieldName = String(field).toLowerCase().trim();
        return !excludeList.includes(cleanFieldName);
      });
    }

    const orStatementList = [];

    targetFields.forEach((field) => {
      let orStatement;
      if (casesensitive) {
        orStatement = `${field} LIKE '%${param}%'`;
      } else {
        orStatement = `LOWER(${field}) LIKE '%${param}%'`;
      }
      orStatementList.push(orStatement);
    });

    if (targetFields.length > 0) {
      this.orFinalStatement = `${orStatementList.join(" OR ")}`;
    } else {
      this.orFinalStatement = "";
    }
  };

  /**
   * Extracts the sort field from request query parameters, or returns a default fallback.
   * @param {Object} req - The Express Request object (`req`).
   * @param {string} sortField - The default fallback column name.
   * @returns {string} The active column name to be used for sorting.
   */
  setSortFieldDefault = (req, sortField) => {
    return req?.query?.sortField?.length > 0 ? req?.query?.sortField : sortField;
  };

  /**
   * Extracts the sort direction from request query parameters, or returns a default fallback.
   * @param {Object} req - The Express Request object (`req`).
   * @param {string} direction - The default fallback direction ('ASC' or 'DESC').
   * @returns {string} The active sorting direction.
   */
  setDirectionDefault = (req, direction) => {
    return req?.query?.direction?.length > 0 ? req?.query?.direction : direction;
  };

  /**
   * Extracts the page number from request query parameters, or returns a default fallback.
   * @param {Object} req - The Express Request object (`req`).
   * @param {number|string} page - The default fallback page number.
   * @returns {number|string} The active page number.
   */
  setPageDefault = (req, page) => {
    return req?.query?.page ?? page;
  };

  /**
   * Extracts rows per page setting from request query parameters, or returns a default fallback.
   * @param {Object} req - The Express Request object (`req`).
   * @param {number|string} rowPerPage - The default fallback value for items count per page.
   * @returns {number|string} The active row limits per page.
   */
  setRowPerPageDefault = (req, rowPerPage) => {
    return req?.query?.rowPerPage ?? rowPerPage;
  };
}

module.exports = Pagination;
