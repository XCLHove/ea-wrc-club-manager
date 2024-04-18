const getPageSizes = (total: number,minPageSize: number = 10, maxPageSize: number = 100) => {
  maxPageSize = Math.min(maxPageSize, total);
  let pageSize = minPageSize;
  const pageSizes = [pageSize];
  while (pageSize < maxPageSize) {
    pageSize *= 2;
    pageSizes.push(pageSize);
  }
  return pageSizes;
};

export default getPageSizes;
