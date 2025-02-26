// Helper function to get snippet of text containing the query
exports.getSnippet = (content, query) => {
  const index = content.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return "";

  const start = Math.max(0, index - 40);
  const end = Math.min(content.length, index + query.length + 40);
  let snippet = content.substring(start, end);

  if (start > 0) snippet = "..." + snippet;
  if (end < content.length) snippet = snippet + "...";

  return snippet;
};
