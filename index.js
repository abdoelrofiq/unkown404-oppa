const _ = require("lodash");

class Pagination {
  sortQuery = "";
  orFinalStatement = "";
  groupQuery = "";

  constructor(oraexec = null, query = null) {
    this.oraexec = oraexec;
    this.query = query;
  }

  stringToArray = (str, separator) => {
    if (!_.isEmpty(str)) {
      return _.split(str, separator).map(_.trim);
    }
    return [];
  };

  countQueryBuilder = () => {
    let countQuery = "";
    let queryRest = [];

    this.query = this.query.replace(/\n/g, " ");
    this.query = this.query.split(/\s+/).join(" ");

    let words = this.query.split(" ");
    let keyword = "FROM";
    let foundKeyword = false;

    for (let word of words) {
      if (foundKeyword) {
        queryRest.push(word);
      }
      if (word.toUpperCase() === keyword && !foundKeyword) {
        foundKeyword = true;
      }
    }

    let select = words[0];
    let queryRestInString = queryRest.join(" ");
    countQuery = select + " COUNT(*) AS TOTAL FROM " + queryRestInString;

    return countQuery;
  };

  getTotalRows = async () => {
    let countQuery = this.countQueryBuilder();
    if (this.orFinalStatement.length > 0) {
      countQuery = countQuery + this.orFinalStatement;
    }
    const countQueryResult = await this.oraexec(countQuery, {});

    return countQueryResult?.rows[0]?.TOTAL ?? 0;
  };

  paginatorQueryBuilder = (page, rowPerPage) => {
    const offset = (page - 1) * rowPerPage;
    const limit = rowPerPage;
    const offsetQuery = ` OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;

    this.query = this.query.replace(/\n/g, " ");
    this.query = this.query.replace(/;/g, "");
    this.query = this.query.split(/\s+/).join(" ");

    const fullQuery =
      this.query + this.orFinalStatement + this.groupQuery + this.sortQuery + offsetQuery;

    return fullQuery;
  };

  sortQueryBuilder = (sortField, direction) => {
    this.sortQuery = ` ORDER BY ${sortField} ${direction}`;
  };

  groupByQueryBuilder = (field) => {
    this.groupQuery = ` GROUP BY ${field}`
  }

  customFilterQueryBuilder = (req) => {
    const param = req?.query?.param ?? "";
    const fields = this.stringToArray(req?.query?.fields ?? "", ",");
    const orStatementList = [];

    fields.forEach((field) => {
      const orStatement = `${field} LIKE '%${param}%'`;
      orStatementList.push(orStatement);
    });

    if (fields.length > 0) {
      if (this.query.toUpperCase().includes("WHERE")) {
        this.orFinalStatement = ` AND (${orStatementList.join(" OR ")}) `;
      } else {
        this.orFinalStatement = ` WHERE ${orStatementList.join(" OR ")} `;
      }
    } else {
      this.orFinalStatement = "";
    }
  };

  setSortFieldDefault = (req, sortField) => {
    return req?.query?.sortField?.length > 0
      ? req?.query?.sortField
      : sortField;
  };

  setDirectionDefault = (req, direction) => {
    return req?.query?.direction?.length > 0
      ? req?.query?.direction
      : direction;
  };

  setPageDefault = (req, page) => {
    return req?.query?.page ?? page;
  };

  setRowPerPageDefault = (req, rowPerPage) => {
    return req?.query?.rowPerPage ?? rowPerPage;
  };
}

module.exports = Pagination;
