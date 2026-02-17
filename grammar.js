/**
 * @file Parser for RPGLE
 * @author Nian Vrey <51823073+YoungVoid@users.noreply.github.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default grammar({
  name: "rpgle",

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => "hello"
  }
});
