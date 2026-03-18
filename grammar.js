/**
 * @file Parser for RPGLE
 * @author Nian Vrey <51823073+YoungVoid@users.noreply.github.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

function caseInsensitive(word) {
  return new RegExp(word
    .split('')
    .map(letter => `[${letter}${letter.toUpperCase()}${letter.toLowerCase()}]`)
    .join(''));
}


function commaSep(rule) {
  return optional(seq(rule, repeat(seq(',', rule))));
}

function colonSep(rule) {
  return optional(seq(rule, repeat(seq(':', rule))));
}

function periodSep(rule) {
  return optional(seq(rule, repeat(seq('.', rule))));
}

// Copied: https://github.com/tree-sitter/tree-sitter-go/blob/master/grammar.js#L32
const PREC = {
  primary: 7,
  unary: 6,
  multiplicative: 5,
  additive: 4,
  comparative: 3,
  and: 2,
  or: 1,
  composite_literal: -1,
};

// TODO: Check these lists, whether they are correct for RPGLE
const multiplicativeOperators = ['*', '/', '%', '<<', '>>', '&', '&^'];
const additiveOperators = ['+', '-', '|', '^'];
const comparativeOperators = ['=', '<>', '<', '<=', '>', '>='];
const assignmentOperators = multiplicativeOperators.concat(additiveOperators).map(operator => operator + '=').concat('=');

const open_block = [
  caseInsensitive('if'),
  caseInsensitive('select'),
  caseInsensitive('dow'),
  caseInsensitive('dou'),
  caseInsensitive('for'),
  caseInsensitive('monitor'),
  caseInsensitive('dcl-proc'),
  caseInsensitive('dcl-pr'),
  caseInsensitive('dcl-pi'),
  caseInsensitive('dcl-ds'),
  caseInsensitive('dcl-enum')
];

const close_block = [
  caseInsensitive('endif'),
  caseInsensitive('endsl'),
  caseInsensitive('enddo'),
  caseInsensitive('endfor'),
  caseInsensitive('endmon'),
  caseInsensitive('end-proc'),
  caseInsensitive('end-pr'),
  caseInsensitive('end-pi'),
  caseInsensitive('end-ds'),
  caseInsensitive('end-enum')
];

export default grammar({
  name: "rpgle",

  extras: ($) => [
    /\s+/, // whitespace
    $.comment,
  ],


  word: $ => $.identifier,


  conflicts: $ => [
    //[$.identifier, $.builtin]
  ],

  rules: {

    source_file: $ => seq(
      optional($.fully_free),
      repeat($._statement)
    ),

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
      $.native_operand_statement,
      $.expression_statement
    ),


    fully_free: $ => prec.left(2,/\*\*[fF][rR][eE][eE]/),

    // =====================
    // Compiler Directives
    // =====================

    compiler_directive: $ => token(seq(
      '/',
      /[A-Za-z-]+/,
      /.*/
    )),

    // =====================
    // H-Spec
    // Control Options
    // https://www.ibm.com/docs/en/i/7.6.0?topic=specifications-control
    // =====================

    ctl_opt: $ => prec.right(2, seq(
      caseInsensitive('ctl-opt'),
      repeat(seq($.keyword_h_spec, optional($.argument_list))),
      ';'
    )),

    // =====================
    // Declarations
    // =====================

    declaration: $ => choice(
      $.dcl_f,
      $.dcl_s,
      $.dcl_ds,
      $.dcl_pr,
      $.dcl_pi
    ),
    
    dcl_f: $ => seq(
      caseInsensitive('dcl-f'),
      $.identifier,
      optional($.type),
      repeat($.keyword_f_spec),
      ';'
    ),


    dcl_s: $ => seq(
      caseInsensitive('dcl-s'),
      $.identifier,
      optional($.type),
      repeat($.keyword_d_spec),
      ';'
    ),

    // BUG: Just wandering if niche case theres dcl-ds and double semi colon without an end-ds,
    // if it will see the second ; as part of the dcl-ds? should, with the way it is set up now...
    // happens a few times, ie with dcl-pr as well.
    dcl_ds: $ => choice(
      // 
      seq(
        token(prec(2, caseInsensitive('dcl-ds'))),
        $.identifier,
        repeat($.keyword_d_spec),
        ';',
        repeat($.field_declaration),
        optional(token(caseInsensitive('end-ds'))),
        optional($.field_reference),
        ';'
      ),
    ),

    field_declaration: $ => seq(
      $.identifier,
      $.type,
      repeat($.keyword_d_spec),
      ';'
    ),

    dcl_pr: $ => seq(
      caseInsensitive('dcl-pr'),
      $.identifier,
      repeat($.keyword_d_spec),
      ';',
      repeat($.parameter),
      caseInsensitive('end-pr'),
      optional($.identifier),
      ';'
    ),

    dcl_pi: $ => seq(
      caseInsensitive('dcl-pi'),
      choice($.identifier, '*n', '*N'),
      optional($.type),
      repeat($.keyword_d_spec),
      ';',
      repeat($.parameter),
      caseInsensitive('end-pi'),
      optional(choice($.identifier, '*n', '*N')),
      ';'
    ),

    parameter: $ => seq(
      $.field_reference,
      optional($.type),
      repeat($.keyword_d_spec),
      ';'
    ),

    procedure: $ => seq(
      caseInsensitive('dcl-proc'),
      $.identifier,
      repeat($.keyword_p_spec),
      ';',
      repeat($._statement),
      caseInsensitive('end-proc'),
      optional($.identifier),
      ';'
    ),

    // =====================
    // Types
    // =====================

    type: $ => choice(
      seq(caseInsensitive('BINDEC', '(', $.number, optional(seq(':', $.number)), ')')),
      seq(caseInsensitive('CHAR'), '(', $.number, ')'),
      seq(caseInsensitive('DATE'), optional(seq('(', choice($.special_value, choice('/','-',',','.','&')), ')'))),
      seq(caseInsensitive('FLOAT', '(', $.number, ')')),
      seq(caseInsensitive('GRAPH', '(', $.number, ')')),
      caseInsensitive('IND'),
      seq(caseInsensitive('INT'), '(', $.number, ')'),
      seq(caseInsensitive('OBJECT'), optional(seq('(', caseInsensitive('*JAVA'), optional(colonSep(choice($.special_value, $.string))), ')'))),
      seq(caseInsensitive('PACKED'), '(', $.number, optional(seq(':', $.number)), ')'),
      seq(caseInsensitive('POINTER'), optional(seq('(', caseInsensitive('*PROC'), ')'))),
      seq(caseInsensitive('TIME'), optional(seq('(', choice($.special_value, choice(':','.',',','&')), ')'))),
      seq(caseInsensitive('TIMESTAMP'), optional(seq('(', $.number, ')'))),
      seq(caseInsensitive('UCS2'), '(', $.number, ')'),
      seq(caseInsensitive('UNS'), '(', $.number, ')'),
      seq(caseInsensitive('VARCHAR'), '(', $.number, optional(seq(':', $.number)), ')',),
      seq(caseInsensitive('VARGRAPH'),'(', $.number, optional(seq(':', $.number)), ')',),
      seq(caseInsensitive('VARUCS2'),'(', $.number, optional(seq(':', $.number)), ')',),
      seq(caseInsensitive('ZONED'),'(', $.number, optional(seq(':', $.number)), ')',),
    ),


    // https://www.ibm.com/docs/en/i/7.6.0?topic=specifications-control-specification-keywords
    keyword_h_spec: $ => choice(
      caseInsensitive('ACTGRP'),
      caseInsensitive('ALLOC'),
      caseInsensitive('ALTSEQ'),
      caseInsensitive('ALWNULL'),
      caseInsensitive('AUT'),
      caseInsensitive('BNDDIR'),
      caseInsensitive('CCSID'),
      caseInsensitive('CCSIDCVT'),
      caseInsensitive('CHARCOUNT'),
      caseInsensitive('CHARCOUNTTYPES'),
      caseInsensitive('COPYNEST'),
      caseInsensitive('COPYRIGHT'),
      caseInsensitive('CURSYM'),
      caseInsensitive('CVTOPT'),
      caseInsensitive('DATEDIT'),
      caseInsensitive('DATEYY'),
      caseInsensitive('DATFMT'),
      caseInsensitive('DCLOPT'),
      caseInsensitive('DEBUG'),
      caseInsensitive('DECEDIT'),
      caseInsensitive('DECPREC'),
      caseInsensitive('DFTACTGRP'),
      caseInsensitive('DFTNAME'),
      caseInsensitive('ENBPFRCOL'),
      caseInsensitive('EXPROPTS'),
      caseInsensitive('EXTBININT'),
      caseInsensitive('FIXNBR'),
      caseInsensitive('FLTDIV'),
      caseInsensitive('FORMSALIGN'),
      caseInsensitive('FTRANS'),
      caseInsensitive('GENLVL'),
      caseInsensitive('INDENT'),
      caseInsensitive('INTPREC'),
      caseInsensitive('LANGID'),
      caseInsensitive('MAIN'),
      caseInsensitive('NOMAIN'),
      caseInsensitive('OPENOPT'),
      caseInsensitive('OPTIMIZE'),
      caseInsensitive('OPTION'),
      caseInsensitive('PGMINFO'),
      caseInsensitive('PRFDTA'),
      caseInsensitive('REQPREXP'),
      caseInsensitive('SRTSEQ'),
      caseInsensitive('STGMDL'),
      caseInsensitive('TEXT'),
      caseInsensitive('THREAD'),
      caseInsensitive('TIMFMT'),
      caseInsensitive('TRUNCNBR'),
      caseInsensitive('USRPRF'),
      caseInsensitive('VALIDATE'),
    ),


    keyword_f_spec: $ => choice(
      caseInsensitive('ALIAS'),
      caseInsensitive('BLOCK'),
      caseInsensitive('COMMIT'),
      caseInsensitive('CHARCOUNT'),
      caseInsensitive('DATA'),
      caseInsensitive('DATFMT'),
      caseInsensitive('DEVID'),
      caseInsensitive('DISK'),
      caseInsensitive('EXTDESC'),
      caseInsensitive('EXTFILE'),
      caseInsensitive('EXTIND'),
      caseInsensitive('EXTMBR'),
      caseInsensitive('FORMLEN'),
      caseInsensitive('FORMOFL'),
      caseInsensitive('HANDLER'),
      caseInsensitive('IGNORE'),
      caseInsensitive('INCLUDE'),
      caseInsensitive('INDDS'),
      caseInsensitive('INFDS'),
      caseInsensitive('INFSR'),
      caseInsensitive('KEYED'),
      caseInsensitive('KEYLOC'),
      caseInsensitive('LIKEFILE'),
      caseInsensitive('MAXDEV'),
      caseInsensitive('OFLIND'),
      caseInsensitive('PASS'),
      caseInsensitive('PGMNAME'),
      caseInsensitive('PLIST'),
      caseInsensitive('PREFIX'),
      caseInsensitive('PRINTER'),
      caseInsensitive('PRTCTL'),
      caseInsensitive('QUALIFIED'),
      caseInsensitive('RAFDATA'),
      caseInsensitive('RECNO'),
      caseInsensitive('RENAME'),
      caseInsensitive('SAVEDS'),
      caseInsensitive('SAVEIND'),
      caseInsensitive('SEQ'),
      caseInsensitive('SFILE'),
      caseInsensitive('SLN'),
      caseInsensitive('SPECIAL'),
      caseInsensitive('STATIC'),
      caseInsensitive('TEMPLATE'),
      caseInsensitive('TIMFMT'),
      caseInsensitive('USAGE'),
      caseInsensitive('USROPN'),
      caseInsensitive('WORKSTN'),
    ),

    keyword_d_spec: $ => choice(
      caseInsensitive('LIKE'),
      caseInsensitive('LIKEDS'),
      caseInsensitive('LIKEREC'),
      caseInsensitive('EXTNAME'),
      caseInsensitive('EXTFLD'),
      caseInsensitive('PREFIX'),
      caseInsensitive('RENAME'),
      caseInsensitive('QUALIFIED'),
      caseInsensitive('DIM'),
      caseInsensitive('CTDATA'),
      caseInsensitive('PERRCD'),
      caseInsensitive('OVERLAY'),
      caseInsensitive('BASED'),
      caseInsensitive('TEMPLATE'),
      caseInsensitive('INZ'),
      caseInsensitive('VALUE'),
      caseInsensitive('CONST'),
      caseInsensitive('OPTIONS'),
      caseInsensitive('VARYING'),
      caseInsensitive('ASCEND'),
      caseInsensitive('DESCEND'),
      caseInsensitive('ALT'),
      caseInsensitive('DTAARA'),
      caseInsensitive('SDS'),
      caseInsensitive('PSDS'),
      caseInsensitive('STATIC'),
      caseInsensitive('AUTOMATIC'),
      caseInsensitive('EXPORT'),
      caseInsensitive('IMPORT'),
      caseInsensitive('EXTPROC'),
      caseInsensitive('PROC'),
      caseInsensitive('PROCPTR'),
      caseInsensitive('NOPASS'),
      caseInsensitive('PASS'),
      caseInsensitive('ALIGN'),
      caseInsensitive('NOALIGN'),
      // caseInsensitive('INT'),
      // caseInsensitive('UNS'),
      // caseInsensitive('PACKED'),
      // caseInsensitive('ZONED'),
      // caseInsensitive('FLOAT'),
      caseInsensitive('REAL'),
      // caseInsensitive('IND'),
      // caseInsensitive('DATE'),
      // caseInsensitive('TIME'),
      // caseInsensitive('TIMESTAMP'),
      // caseInsensitive('GRAPH'),
      // caseInsensitive('UCS2'),
      // caseInsensitive('VARGRAPH'),
      // caseInsensitive('VARCHAR'),
      // caseInsensitive('VARUCS2'),
      // caseInsensitive('POINTER'),
      // caseInsensitive('OBJECT'),
      caseInsensitive('SQLTYPE'),
      caseInsensitive('DATFMT'),
      caseInsensitive('TIMFMT'),
      caseInsensitive('CCSID'),
      caseInsensitive('INTDATE'),
      caseInsensitive('INTTIME'),
      caseInsensitive('ALIAS'),
      caseInsensitive('QUAL'),
      caseInsensitive('OCCURS'),
      caseInsensitive('LEN'),
      caseInsensitive('PROC'),
      caseInsensitive('EXTPGM'),
      caseInsensitive('ENTRY'),
      caseInsensitive('OPTIONS'),
    ),

    keyword_p_spec: $ => choice($.special_value, 'TODO:'),

    special_value: $ => /\*[A-Za-z][A-Za-z0-9_]*/,

    indicator: $ => /\*[iI][nN]([0-9]{2})|\*[lL][rR]/,

    // keyword: $ => prec(0, seq(
    //   choice(
    //     $.special_value, 
    //     $.keyword_h_spec,
    //     $.keyword_f_spec,
    //     $.keyword_d_spec,
    //   ),
    //   optional($.argument_list)
    // )),

    // =====================
    // Native Operands
    // =====================

    // NOTE: For now this is kind of just a dump for the `exfmt` type of operations
    
    native_operand: $ => choice(
      caseInsensitive('WRITE'),
      caseInsensitive('exfmt'),
      caseInsensitive('read'),
      caseInsensitive('readc'),
    ),


    native_operand_statement: $ => seq(
      $.native_operand,
      optional($.field_reference), // should perhaps be $.expression, for now $.identifier (or $.field_reference in case) makes more sense since i only have write/exfmt/read
      ';'
    ),






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
      $.field_reference,
      '=',
      $.expression,
      ';'
    )),

    expression_statement: $ => seq(
      $.expression,
      ';'
    ),

    // =====================
    // Control Flow
    // =====================

    // TEST: Check if repeat requires you to have elseif statements now...
    if_statement: $ => seq(
      caseInsensitive('if'),
      $.expression,
      ';',
      repeat($._statement),
      repeat($.elseif_clause),
      optional($.else_clause),
      caseInsensitive('endif'),
      ';'
    ),

    elseif_clause: $ => seq(
      caseInsensitive('elseif'),
      $.expression,
      ';',
      repeat($._statement)
    ),

    else_clause: $ => seq(
      caseInsensitive('else'),
      ';',
      repeat($._statement)
    ),

    select_statement: $ => seq(
      caseInsensitive('select'),
      optional($.field_reference),
      ';',
      repeat($.when_clause),
      optional($.other_clause),
      caseInsensitive('endSl'),
      ';'
    ),

    when_clause: $ => seq(
      choice(
        seq(
          caseInsensitive('when'), 
          $.expression
        ), 
        seq(
          choice(caseInsensitive('when-is'), caseInsensitive('when-in')), 
          $.expression
        )
      ),
      ';',
      repeat($._statement)
    ),

    other_clause: $ => seq(
      caseInsensitive('other'),
      ';',
      repeat($._statement)
    ),

    dow_loop: $ => seq(
      caseInsensitive('dow'),
      $.expression,
      ';',
      repeat($._statement),
      caseInsensitive('enddo'),
      ';'
    ),

    dou_loop: $ => seq(
      caseInsensitive('dou'),
      $.expression,
      ';',
      repeat($._statement),
      caseInsensitive('enddo'),
      ';'
    ),

    for_loop: $ => seq(
      caseInsensitive('for'),
      $.assignment,
      caseInsensitive('to'),
      $.expression,
      optional(seq('by', $.expression)),
      ';',
      repeat($._statement),
      caseInsensitive('endfor'),
      ';'
    ),

    monitor_block: $ => seq(
      caseInsensitive('monitor'),
      ';',
      repeat($._statement),
      repeat($.on_error_clause),
      caseInsensitive('endmon'),
      ';'
    ),

    on_error_clause: $ => seq(
      caseInsensitive('on-error'),
      optional($.expression),
      ';',
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
      ';'
    )),

    call_statement: $ => seq(
      choice(caseInsensitive('callp'), caseInsensitive('call')),
      $.identifier,
      optional($.argument_list),
      ';'
    ),

    argument_list: $ => seq(
      '(',
      optional(colonSep($.expression)),
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
      $.field_reference,
      $.special_value,
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

    unary_expression: $ => prec.left(seq(
      choice('-', caseInsensitive('not')),
      $.expression
    )),

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
    // BUG: Function can be without brackets
    function_call: $ => prec(2, seq(
      choice($.identifier, $.builtin),
      $.argument_list 
    )),

      // Just making builtin's any word that starts with a %
      builtin: $ => /%[A-Za-z][A-Za-z0-9_]*/,
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

    // You can have DataStruct.FieldName and so forth
    dotted_identifier: $ => prec.right(3, seq(
      $.identifier,
      repeat(seq('.', $.identifier))
    )),

    field_reference: $ => prec.right(2, choice($.identifier, $.dotted_identifier)),

    comment: $ => token(choice(
      seq('//', /.*/)

 // FIX: this feels like it wont work, so leaving the col 6 * comments for now. Fix later!
      //seq('*', /.*/)
    ))
  }
});

//});
