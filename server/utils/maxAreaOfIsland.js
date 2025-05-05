function maxAreaOfIsland(grid, color) {
  let maxArea = 0;
  const rows = grid.length;
  const cols = grid[0].length;
  const visited = new Set();

  function dfs(r, c) {
    if (
      r < 0 || r >= rows ||
      c < 0 || c >= cols ||
      grid[r][c] !== color ||
      visited.has(`${r},${c}`)
    ) {
      return 0;
    }

    visited.add(`${r},${c}`);
    return 1 + dfs(r + 1, c) + dfs(r - 1, c) + dfs(r, c + 1) + dfs(r, c - 1);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === color && !visited.has(`${r},${c}`)) {
        maxArea = Math.max(maxArea, dfs(r, c));
      }
    }
  }

  return maxArea;
}

module.exports = { maxAreaOfIsland }; 