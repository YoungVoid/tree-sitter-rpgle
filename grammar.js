/**
 * @file Parser for RPGLE
 * @author Nian Vrey <51823073+YoungVoid@users.noreply.github.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check


function caseInsensitive(word) {
  return word
    .split('')
    .map(letter => `[${letter}${letter.toUpperCase()}${letter.toLowerCase()}]`)
    .join('');
}


export default grammar({
  name: "rpgle",

  extras: ($) => [
    /\s/, // whitespace
    $.comment,
  ],

  rules: {
   source_file: $ => repeat($._definition),

    _definition: $ => choice(
      $.function_definition,
      $.comment,
      $.built_in_todo

      // TODO: other kinds of definitions
    ),

    function_definition: $ => seq(
      new RegExp(caseInsensitive('dcl-proc')),
      $.identifier,
      new RegExp(caseInsensitive('end-proc'))
    ),

    identifier: $ => /[a-zA-Z]+/,

    comment: ($) => token("//"),

    built_in_todo: $ => choice(
      new RegExp(caseInsensitive('dcl-ds')),
      new RegExp(caseInsensitive('end-ds')),
      new RegExp(caseInsensitive('dcl-pi')),
      new RegExp(caseInsensitive('return'))
    )


  }


});
