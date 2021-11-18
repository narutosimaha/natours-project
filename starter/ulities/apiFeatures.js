class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    //1) Filetering
    let queryObj = { ...this.queryString };
    const excludeProperties = ['page', 'limit', 'sort', 'fields'];
    excludeProperties.forEach(el => delete queryObj[el]);
    console.log(this.queryString, queryObj);

    //2) Advanced filtering $lt $lte $gt $gte
    const queryStr = JSON.stringify(queryObj);
    queryObj = JSON.parse(
      queryStr.replace(/\b(gte|gt|lt|lte)\b/g, match => `$${match}`)
    );
    this.query = this.query.find(queryObj);
    return this;
  }

  //3) Sort feature
  sort() {
    if (this.queryString.sort) {
      //Convert string "-price,ratingsAventure" to "-price ratingsAdventure"
      const sortParam = this.queryString.sort.split(',').join(' ');
      console.log(sortParam);
      this.query = this.query.sort(sortParam);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  // 4)Fields limitting
  limit() {
    if (this.queryString.fields) {
      const selectParam = this.queryString.fields.split(',').join(' ');
      console.log(selectParam);
      this.query = this.query.select(selectParam);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  // 5) Pagination if displaying 10 documents per page    page 1: 1-10, page 2:11-20,..., page n: (n-1)*10+1  -   n*10
  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}
module.exports = ApiFeatures;
