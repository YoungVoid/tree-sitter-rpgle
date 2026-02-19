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


function commaSep(rule) {
  return optional(seq(rule, repeat(seq(',', rule))));
}

export default grammar({
  name: "rpgle",

  extras: ($) => [
    /\s/, // whitespace
    $.comment,
  ],

  /*
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
      $.end_of_statement,
      new RegExp(caseInsensitive('end-proc')),
      $.end_of_statement,
    ),

    // BUG: Not catering for:
    // underscores or other similar special characters?
    identifier: $ => /[a-zA-Z][a-zA-Z0-9]+/, 

    comment: ($) => token("//"),

    built_in_todo: $ => choice(
      new RegExp(caseInsensitive('dcl-ds')),
      new RegExp(caseInsensitive('end-ds')),
      new RegExp(caseInsensitive('dcl-pi')),
      new RegExp(caseInsensitive('return'))
    ),

    end_of_statement: $ => ';'


  }
*/

  // NOTE: Asked ChatGPT to generate

  word: $ => $.identifier,


  conflicts: $ => [
    [$.identifier, $.builtin]
  ],

  rules: {

    source_file: $ => repeat($._statement),

    // =====================
    // Core Statements
    // =====================

    _statement: $ => choice(
      $.ctl_opt,
      $.declaration,
      $.procedure,
      $.assignment,
      $.if_statement,
      $.select_statement,
      $.dow_loop,
      $.dou_loop,
      $.for_loop,
      $.monitor_block,
      $.return_statement,
      $.call_statement,
      $.sql_block,
      $.compiler_directive,
      $.expression_statement
    ),

    // =====================
    // Compiler Directives
    // =====================

    compiler_directive: $ => token(seq(
      '/',
      /[A-Za-z-]+/,
      /.*/
    )),

    // =====================
    // Control Options
    // =====================

    ctl_opt: $ => seq(
      caseInsensitive('ctl-opt'),
      repeat1($.identifier),
      optional(';')
    ),

    // =====================
    // Declarations
    // =====================

    declaration: $ => choice(
      $.dcl_s,
      $.dcl_ds,
      $.dcl_pr,
      $.dcl_pi
    ),

    dcl_s: $ => seq(
      caseInsensitive('dcl-s'),
      $.identifier,
      optional($.type),
      repeat($.keyword),
      optional(';')
    ),

    // BUG: Just wandering if niche case theres dcl-ds and double semi colon without an end-ds,
    // if it will see the second ; as part of the dcl-ds? should, with the way it is set up now...
    // happens a few times, ie with dcl-pr as well.
    dcl_ds: $ => seq(
      caseInsensitive('dcl-ds'),
      $.identifier,
      repeat($.keyword),
      optional(';'),
      repeat($.field_declaration),
      optional(caseInsensitive('end-ds')),
      optional($.identifier),
      optional(';')
    ),

    field_declaration: $ => seq(
      $.identifier,
      optional($.type),
      repeat($.keyword),
      optional(';')
    ),

    dcl_pr: $ => seq(
      caseInsensitive('dcl-pr'),
      $.identifier,
      repeat($.keyword),
      optional(';'),
      repeat($.parameter),
      caseInsensitive('end-pr'),
      optional($.identifier),
      optional(';')
    ),

    dcl_pi: $ => seq(
      caseInsensitive('dcl-pi'),
      choice($.identifier, '*n', '*N'),
      optional($.type),
      repeat($.keyword),
      optional(';'),
      repeat($.parameter),
      caseInsensitive('end-pi'),
      choice($.identifier, '*n', '*N'),
      optional(';')
    ),

    parameter: $ => seq(
      $.identifier,
      optional($.type),
      repeat($.keyword),
      optional(';')
    ),

    procedure: $ => seq(
      caseInsensitive('dcl-proc'),
      $.identifier,
      repeat($.keyword),
      optional(';'),
      repeat($._statement),
      caseInsensitive('end-proc'),
      optional($.identifier),
      optional(';')
    ),

    // =====================
    // Types
    // =====================

    type: $ => choice(
      seq(caseInsensitive('char'), '(', $.number, ')'),
      seq(caseInsensitive('varchar'), '(', $.number, ')'),
      seq(caseInsensitive('packed'), '(', $.number, optional(seq(':', $.number)), ')'),
      seq(caseInsensitive('zoned'), '(', $.number, optional(seq(':', $.number)), ')'),
      caseInsensitive('int'),
      caseInsensitive('ind'),
      caseInsensitive('date'),
      caseInsensitive('time'),
      caseInsensitive('timestamp')
    ),

    keyword: $ => $.identifier,

    // =====================
    // Assignments
    // =====================

/*
Error: Error when generating parser

Caused by:
    Unresolved conflict for symbol sequence:

      identifier  •  '='  …

    Possible interpretations:

      1:  (assignment  identifier  •  '='  expression  ';')
      2:  (assignment  identifier  •  '='  expression)
      3:  (expression  identifier)  •  '='  …

    Possible resolutions:

      1:  Specify a higher precedence in `assignment` than in the other rules.
      2:  Specify a higher precedence in `expression` than in the other rules.
      3:  Specify a left or right associativity in `expression`
      4:  Add a conflict for these rules: `assignment`, `expression`
*/
    // Guessing prec.right will fix the above issue
    assignment: $ => prec.right(2, seq(
      $.identifier,
      '=',
      $.expression,
      optional(';')
    )),

    expression_statement: $ => seq(
      $.expression,
      optional(';')
    ),

    // =====================
    // Control Flow
    // =====================

    // TEST: Check if repeat requires you to have elseif statements now...
    if_statement: $ => seq(
      caseInsensitive('if'),
      $.expression,
      optional(';'),
      repeat($._statement),
      repeat($.elseif_clause),
      optional($.else_clause),
      caseInsensitive('endif'),
      optional(';')
    ),

    elseif_clause: $ => seq(
      caseInsensitive('elseif'),
      $.expression,
      optional(';'),
      repeat($._statement)
    ),

    else_clause: $ => seq(
      caseInsensitive('else'),
      optional(';'),
      repeat($._statement)
    ),

    select_statement: $ => seq(
      caseInsensitive('select'),
      optional($.identifier),
      optional(';'),
      repeat($.when_clause),
      optional($.other_clause),
      caseInsensitive('endSl'),
      optional(';')
    ),

    when_clause: $ => seq(
      choice(
        seq(
          caseInsensitive('when'), 
          $.expression
        ), 
        seq(
          choice(caseInsensitive('when-is'), caseInsensitive('when-in')), 
          choice($.expression, $.identifier)
        )
      ),
      optional(';'),
      repeat($._statement)
    ),

    other_clause: $ => seq(
      caseInsensitive('other'),
      optional(';'),
      repeat($._statement)
    ),

    dow_loop: $ => seq(
      caseInsensitive('dow'),
      $.expression,
      optional(';'),
      repeat($._statement),
      caseInsensitive('enddo'),
      optional(';')
    ),

    dou_loop: $ => seq(
      caseInsensitive('dou'),
      $.expression,
      optional(';'),
      repeat($._statement),
      caseInsensitive('enddo'),
      optional(';')
    ),

    for_loop: $ => seq(
      caseInsensitive('for'),
      $.assignment,
      caseInsensitive('to'),
      $.expression,
      optional(seq('by', $.expression)),
      optional(';'),
      repeat($._statement),
      caseInsensitive('endfor'),
      optional(';')
    ),

    monitor_block: $ => seq(
      caseInsensitive('monitor'),
      optional(';'),
      repeat($._statement),
      repeat($.on_error_clause),
      caseInsensitive('endmon'),
      optional(';')
    ),

    on_error_clause: $ => seq(
      caseInsensitive('on-error'),
      optional($.expression),
      optional(';'),
      repeat($._statement)
    ),

    


/*
Error: Error when generating parser

Caused by:
    Unresolved conflict for symbol sequence:

      '[rRr][eEe][tTt][uUu][rRr][nNn]'  •  '('  …

    Possible interpretations:

      1:  (return_statement  '[rRr][eEe][tTt][uUu][rRr][nNn]'  •  expression  ';')
      2:  (return_statement  '[rRr][eEe][tTt][uUu][rRr][nNn]'  •  expression)
      3:  (return_statement  '[rRr][eEe][tTt][uUu][rRr][nNn]')  •  '('  …

    Possible resolutions:

      1:  Specify a left or right associativity in `return_statement`
      2:  Add a conflict for these rules: `return_statement`
*/
    // Guessing prec.right since we want to pull the largest one? if it has both optionals, dont end on return, end on all three.
    // See above error
    return_statement: $ => prec.right(2, seq(
      caseInsensitive('return'),
      optional($.expression),
      optional(';')
    )),

    call_statement: $ => seq(
      choice(caseInsensitive('callp'), caseInsensitive('call')),
      $.identifier,
      optional($.argument_list),
      optional(';')
    ),

    argument_list: $ => seq(
      '(',
      optional(commaSep($.expression)),
      ')'
    ),

    // =====================
    // Embedded SQL (.sqlrpgle)
    // =====================

    sql_block: $ => seq(
      caseInsensitive('exec'),
      caseInsensitive('sql'),
      repeat1(/[^;]+/),
      ';'
    ),

    // =====================
    // Expressions
    // =====================

    expression: $ => choice(
      $.binary_expression,
      $.unary_expression,
      $.function_call,
      $.literal,
      $.identifier,
      seq('(', $.expression, ')')
    ),

    binary_expression: $ => prec.left(seq(
      $.expression,
      choice(
        '+', '-', '*', '/',
        '=', '<>', '<', '>', '<=', '>=',
        caseInsensitive('and'), caseInsensitive('or')
      ),
      $.expression
    )),

    unary_expression: $ => seq(
      choice('-', caseInsensitive('not')),
      $.expression
    ),

/*
Error: Error when generating parser

Caused by:
    Unresolved conflict for symbol sequence:

      identifier  •  '('  …

    Possible interpretations:

      1:  (expression  identifier)  •  '('  …
      2:  (function_call  identifier  •  argument_list)

    Possible resolutions:

      1:  Specify a higher precedence in `function_call` than in the other rules.
      2:  Specify a higher precedence in `expression` than in the other rules.
      3:  Specify a left or right associativity in `expression`
      4:  Add a conflict for these rules: `expression`, `function_call`
*/
    // Guessing prec(2..) will fix above error
    function_call: $ => prec(2, seq(
      choice($.identifier, $.builtin),
      $.argument_list
    )),

      // Just making builtin's any word that starts with a %
      builtin: $ => /%\w/,
  /*
    builtin: $ => token(choice(
      '%trim',
      '%subst',
      '%len',
      '%date',
      '%time',
      '%timestamp',
      '%char',
      '%int',
      '%dec'
    )),
  */

    literal: $ => choice(
      $.number,
      $.string
    ),

    number: $ => /\d+/,

      // BUG: Think that this should be counted as 1 string since double '' should count as an ' inside, 
      // ie -> 'test one ''value'' here'
      string: $ => choice(
        seq(
          "'",
          repeat(/[^']/),
          "'"
        ),
        seq(
          '"',
          repeat(/[^"]/),
          '"'
        ),
      ),

    identifier: $ => /[A-Za-z_][A-Za-z0-9_]*/,

    comment: $ => token(choice(
      seq('//', /.*/)

 // FIX: this feels like it wont work, so leaving the col 6 * comments for now. Fix later!
      //seq('*', /.*/)
    ))
  }
});

//});
