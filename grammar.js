/**
 * @file Parser for RPGLE
 * @author Nian Vrey <51823073+YoungVoid@users.noreply.github.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

  
// --- Case-insensitive helper ---
function ci(word) {
  return new RegExp(
    word
      .split('')
      .map(char => {
        if (/[a-zA-Z]/.test(char)) {
          return `[${char.toLowerCase()}${char.toUpperCase()}]`;
        }
        return char.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      })
      .join('')
  );
};

// Copied from tree-sitter-go: https://github.com/tree-sitter/tree-sitter-go/blob/master/grammar.js#L11
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

const multiplicativeOperators = ['*', '/'];
const additiveOperators = ['+', '-'];
const comparativeOperators = ['=', '<>', '<', '<=', '>', '>='];

export default grammar({
  name: 'rpgle',

  extras: $ => [
    /\s/,
    $.comment
  ],

  word: $ => $.identifier,

  rules: {

    // --- ROOT ---
    source_file: $ => repeat($._top_level),

    _top_level: $ => choice(
      $.fully_free,
      $.compiler_directive,
      $.control_spec,
      $.file_spec,
      $.definition,
      $.procedure,
      $.statement,
    ),


    fully_free: $ => prec.left(5,/\*\*[fF][rR][eE][eE]/),


    // =====================
    // Compiler Directives
    // =====================

    compiler_directive: $ => token(seq(
      '/',
      /[A-Za-z-]+/,
      /.*/
    )),

    // =========================================================
    // H-SPEC (ctl-opt)
    // =========================================================
    control_spec: $ => seq(
      alias(ci('ctl-opt'), $.keyword),
      repeat($.keyword),
      ';'
    ),

    // =========================================================
    // F-SPEC (dcl-f)
    // =========================================================
    file_spec: $ => seq(
      alias(ci('dcl-f'), $.keyword),
      field('name', $.identifier),
      repeat($.keyword),
      ';'
    ),

    // =========================================================
    // D-SPEC (definitions)
    // =========================================================
    definition: $ => choice(
      $.dcl_s,
      $.dcl_c,
      $.dcl_ds,
      $.dcl_pr,
      $.dcl_pi,
      //TODO: dcl-enum,
    ),

    dcl_s: $ => prec(2,seq(
      alias(ci('dcl-s'), $.keyword),
      field('name', $.identifier),
      optional(field('type', $.type_expression)),
      repeat($.keyword),
      ';'
    )),

    dcl_c: $ => seq(
      alias(ci('dcl-c'), $.keyword),
      field('name', $.identifier),
      repeat($.expression),
      ';'
    ),

    // --- Data Structure ---
    //   // TODO: alias the ds_block to block? consider recursive inside dcl_ds_block - they all need to be alias'd
    dcl_ds: $ => choice(
      $.dcl_ds_block,
      $.dcl_ds_likeds_inline,
      $.dcl_ds_inline
    ),

    dcl_ds_block: $ => prec.right(2, seq(
      alias(ci('dcl-ds'), $.keyword),
      field('name', $.identifier),
      repeat($.keyword),
      ';',
      repeat(choice($.ds_subfield, $.dcl_ds_block, $.dcl_ds_inline)),
      alias(ci('end-ds'), $.keyword),
      optional($.identifier),
      ';'
    )),

    // Inline form for LIKEDS/LIKEREC only
    dcl_ds_likeds_inline: $ => seq(
      alias(ci('dcl-ds'), $.keyword),
      field('name', $.identifier),
      repeat1(
        field('likeds_keyword', choice(
          seq(ci('likeds'), $.keyword_argument),
          seq(ci('likerec'), $.keyword_argument)
        ))
      ),
      repeat($.keyword), // allow DIM, etc.
      ';'
    ),

    // Inline form for END-DS only (no subfields)
    dcl_ds_inline: $ => seq(
      alias(ci('dcl-ds'), $.keyword),
      field('name', $.identifier),
      repeat($.keyword),
      ci('end-ds'),
      ';'
    ),


    ds_subfield: $ => seq(
      optional(alias(ci('dcl-subf'), $.keyword)),
      field('name', $.identifier),
      optional(field('type', choice($.type_expression, $.psds_types))),
      repeat($.keyword),
      ';'
    ),

    // --- Prototype ---
    dcl_pr: $ => choice(
      $.dcl_pr_block,
      $.dcl_pr_inline
    ),

    dcl_pr_block: $ => prec(2,seq(
      alias(ci('dcl-pr'), $.keyword),
      field('name', $.identifier),
      repeat($.keyword),
      ';',
      repeat($.parameter), 
      alias(ci('end-pr'), $.keyword),
      ';'
    )),

    dcl_pr_inline: $ => seq(
      alias(ci('dcl-pr'), $.keyword),
      field('name', $.identifier),
      repeat($.keyword),
      optional(alias(ci('end-pr'), $.keyword)),
      ';'
    ),

    // --- Procedure Interface ---
    dcl_pi: $ => choice(
      $.dcl_pi_block,
      $.dcl_pi_inline
    ),

    dcl_pi_block: $ => seq(
      alias(ci('dcl-pi'), $.keyword),
      field('name', choice($.identifier, $.anonymous_name)),
      repeat($.keyword),
      ';',
      repeat($.parameter), 
      alias(ci('end-pi'), $.keyword),
      optional(choice($.identifier, $.anonymous_name)),
      ';'
    ),

    dcl_pi_inline: $ => seq(
      alias(ci('dcl-pi'), $.keyword),
      field('name', choice($.identifier, $.anonymous_name)),
      repeat($.keyword),
      alias(ci('end-pi'), $.keyword),
      ';',
    ),

    parameter: $ => seq(
      optional(alias(ci('dcl-parm'), $.keyword)),
      field('name', choice($.identifier, $.anonymous_name)),
      optional(field('type', $.type_expression)),
      repeat($.keyword),
      ';'
    ),

    // =========================================================
    // P-SPEC (procedures)
    // =========================================================
    procedure: $ => seq(
      alias(ci('dcl-proc'), $.keyword),
      field('name', choice($.identifier, $.anonymous_name)),
      repeat($.keyword),
      ';',
      repeat(choice(
        $.statement,
        $.definition,
        $.procedure,
      )),
      alias(ci('end-proc'), $.keyword),
      optional(choice($.identifier, $.anonymous_name)),
      ';'
    ),

    // =========================================================
    // C-SPEC (statements)
    // =========================================================
    statement: $ => choice(
      seq(optional($.opcode), optional($.expression), ';'),
      $.subr_statement,
      $.do_loop_statement,
      $.for_loop_statement,
      $.select_statement,
      $.when_statement,
      $.other_statement,
      $.if_statement,
      $.embedded_sql_statement,
    ),

    block: $ => prec.right(seq(
      repeat1($.statement),
    )),
    
    // Technically C-Spec, technically a statement, not sure my brain likes it here
    subr_statement: $ => prec(2,seq(
      alias(ci('BEGSR'), $.keyword),
      field('name', $.identifier),
      ';',
      optional($.block),
      alias(ci('ENDSR'), $.keyword),
      optional($.identifier), // Return-Point
      ';'
    )),

    do_loop_statement: $ => seq(
      alias(choice(ci('DOU'), ci('DOW')), $.keyword),
      optional($.keyword_argument),
      field('condition', $.expression),
      ';',
      optional($.block),
      alias(ci('ENDDO'), $.keyword),
      ';',
    ),


    for_loop_statement: $ => seq(
      alias(ci('FOR'), $.keyword),
      optional($.keyword_argument),
      field('index', $.expression), // can either be `index-name` or `index-name = 1`
      repeat(choice(
        seq(ci('BY'), field('by', $.expression)),
        seq(choice(ci('TO'), ci('DOWNTO')), field('by', $.expression)),
      )),
      ';',
      optional($.block),
      alias(ci('ENDFOR'), $.keyword),
      ';',
    ),


    foreach_loop_statement: $ => seq(
      alias(ci('FOR-EACH'), $.keyword),
      optional($.keyword_argument),
      $.binary_expression,
      ';',
      optional($.block),
      alias(ci('ENDFOR'), $.keyword),
      ';',
    ),


    select_statement: $ => seq(
      alias(ci('SELECT'), $.keyword),
      optional(field('value', $.expression)),
      ';',
      repeat(choice($.when_statement, $.other_statement)),
      alias(ci('ENDSL'), $.keyword),
      ';'
    ),

    when_statement: $ => prec.right(seq(
      choice(
        seq(alias(ci('WHEN'), $.keyword), optional($.keyword_argument), field('condition', $.expression), ';'),
        seq(alias(choice(ci('WHEN-IS'),ci('WHEN-IN')), $.keyword), field('value', $.expression), ';'),
      ),
      optional(field('consequence', $.block)),
    )),

    other_statement: $ => prec.right(seq(
      alias(ci('OTHER'), $.keyword), 
      ';',
      optional(field('consequence', $.block)),
    )),

    if_statement: $ => prec.right(seq(
      alias(ci('IF'), $.keyword),
      field('condition', $.expression),
      ';',
      optional(field('consequence', $.block)),
      repeat(seq(
        alias(ci('ELSEIF'), $.keyword),
        optional(field('alternative', $.block))
      )),
      optional(seq(
        alias(ci('ELSE'), $.keyword),
        optional(field('alternative', $.block))
      )),
    )),



    //TODO: Some or all of these should be pulled into blocks, ie if
    //      Ideally only opcodes that stands alone remains.
    // Doing this so that DCL-DS block won't think the subf are opcodes
    // ie DCL-DS test Qualified;
    //      field char(10);
    //    END-DS;
    // it thought field is opcode, char is function call, and dcl-ds parsed to dcl_ds_inline
    opcode: $ => alias(choice(
      ci('ACQ'),
      ci('CALLP'),
      ci('CHAIN'),
      ci('CLEAR'),
      ci('CLOSE'),
      ci('COMMIT'),
      ci('DATA-GEN'),
      ci('DATA-INTO'),
      ci('DEALLOC'),
      ci('DELETE'),
      ci('DSPLY'),
      ci('DUMP'),
      // ENDs
      ci('ENDMON'),
      //
      ci('EVAL'),
      ci('EVALR'),
      ci('EVAL-CORR'),
      ci('EXCEPT'),
      ci('EXFMT'),
      ci('EXSR'),
      ci('FEOD'),
      ci('FORCE'),
      ci('IN'),
      ci('ITER'),
      ci('LEAVE'),
      ci('LEAVESR'),
      ci('MONITOR'),
      ci('NEXT'),
      ci('ON-ERROR'),
      ci('ON-EXCP'),
      ci('ON-EXIT'),
      ci('OPEN'),
      ci('OUT'),
      ci('POST'),
      ci('READ'),
      ci('READC'),
      ci('READE'),
      ci('READP'),
      ci('READPE'),
      ci('REL'),
      ci('RESET'),
      ci('RETURN'),
      ci('ROLBK'),
      ci('SETGT'),
      ci('SETLL'),
      ci('SND-MSG'),
      ci('SORTA'),
      ci('TEST'),
      ci('UNLOCK'),
      ci('UPDATE'),
      ci('WRITE'),
      ci('XML-INTO'),
      ci('XML-SAX'),
    )
      , $.keyword),


    embedded_sql_statement: $ => seq(
        alias(seq(ci('EXEC'), ci('SQL')), $.keyword),
       /[^;]+/,
      ';',
    ),


    // =========================================================
    // KEYWORDS (shared across specs)
    // =========================================================
    keyword: $ => prec.right(seq(
      field('name', $.identifier),
      optional( //choice(
        $.keyword_argument,
        //$.parenthesized_expression
        //)
      )
    )),

    keyword_argument: $ => prec(1,seq(
      '(',
      optional($.argument_list),
      ')'
    )),

    argument_list: $ => prec(1,seq(
      $.expression,
      repeat(seq(':', $.expression))
    )),

    // =========================================================
    // EXPRESSIONS
    // =========================================================
    expression: $ => choice(
      $.binary_expression,
      $.unary_expression,
      $.field_access,
      $.subscript_expression,
      $.function_call,
      $.identifier,
      $.literal,
      $.parenthesized_expression
    ),

    parenthesized_expression: $ => prec(2,seq(
      '(',
      optional($.expression),
      ')'
    )),

    // Copied from tree-sitter-go
    binary_expression: $ => {
      const table = [
        [PREC.multiplicative, choice(...multiplicativeOperators)],
        [PREC.additive, choice(...additiveOperators)],
        [PREC.comparative, choice(...comparativeOperators)],
        [PREC.and, ci('AND')],
        [PREC.or, ci('OR')],
      ];

      return choice(...table.map(([precedence, operator]) =>
        // @ts-ignore
        prec.left(precedence, seq(
          field('left', $.expression),
          // @ts-ignore
          field('operator', operator),
          field('right', $.expression),
        )),
      ));
    },

    unary_expression: $ => prec(PREC.unary, seq(
      field('operator', choice('+', '-', '*','/', ci('NOT'))),
      field('argument', $.expression)
    )),

    operator: $ => choice(
      '+', '-', '*', '/', '=', '<>', '<', '>', '<=', '>=', ci('IN'), ci('NOT'), ci('AND'), ci('OR')
    ),

    // --- Function Call ---
    function_call: $ => prec(PREC.primary,seq(
      field('name', $.identifier),
      '(',
      optional($.argument_list),
      ')'
    )),

    // --- Field Access (QUALIFIED DS SUPPORT) ---
    field_access: $ => prec(PREC.primary, seq(
      field('object', $.expression),
      '.',
      field('field', $.identifier)
    )),

    // --- Array access ---
    subscript_expression: $ => prec(PREC.primary, seq(
      field('object', $.expression),
      '(',
      field('index', $.expression),
      ')'
    )),

    // =========================================================
    // Types
    // =========================================================
    type_expression: $ => prec(2,choice(
      $.builtin_type,
      $.qualified_type
    )),

    psds_types: $ => choice(
      ci('*PROC'), ci('*STATUS'), ci('*ROUTINE'), ci('*PARAMS')
    ),

    // Qualified Type for external defined like
    //    `dcl-s customer likeds(CustomerDS);`
    //    `dcl-s obj object(*JAVA:com.example.MyClass);`
    //    `dcl-s ds likeds(OuterDS.InnerDS);`
    qualified_type: $ => seq(
      $.keyword, 
      '(', 
        choice( 
          $.identifier,
          $.field_access,
        ),
        ')'
    ),

    // type_expression: $ => choice(
    //   $.builtin_type,
    //   $.qualified_type
    // ),

    builtin_type: $ => choice(
      $.char_type,
      $.varchar_type,
      $.numeric_type,
      $.date_type,
      $.time_type,
      $.timestamp_type,
      $.pointer_type,
      $.object_type,
      $.ind_type
    ),

    // 
    // Char Types
    // 
    char_type: $ => seq(
      alias(ci('char'), $.type_keyword),
      '(',
        $.expression,
        ')'
    ),

    varchar_type: $ => seq(
      alias(choice(ci('varchar'), ci('vargraph'), ci('varucs2')), $.type_keyword),
      '(',
        $.expression,
        optional(seq(':', $.expression)),
        ')'
    ),

    graph_type: $ => seq(
      alias(choice(ci('graph'), ci('ucs2')), $.type_keyword),
      '(',
        $.expression,
        ')'
    ),

    // 
    // Numeric Types
    // 
    numeric_type: $ => seq(
      alias(choice(
        ci('int'),
        ci('uns'),
        ci('packed'),
        ci('zoned'),
        ci('bindec')
      ), $.type_keyword),
      '(',
        $.expression,
        optional(seq(':', $.expression)),
        ')'
    ),

    // 
    // Date/Time Types
    // 
    date_type: $ => seq(
      alias(ci('date'), $.type_keyword),
      optional($.parenthesized_expression)
    ),

    time_type: $ => seq(
      alias(ci('time'), $.type_keyword),
      optional($.parenthesized_expression)
    ),

    timestamp_type: $ => seq(
      alias(ci('timestamp'), $.type_keyword),
      optional($.parenthesized_expression)
    ),

    // 
    // Special Types
    // 
    pointer_type: $ => seq(
      alias(ci('pointer'), $.type_keyword),
      optional($.parenthesized_expression)
    ),

    object_type: $ => seq(
      alias(ci('object'), $.type_keyword),
      optional($.parenthesized_expression)
    ),

  ind_type: $ => alias(ci('ind'), $.type_keyword),
    // =========================================================
    // TERMINALS
    // =========================================================
    identifier: $ => /[A-Za-z_@%#$][A-Za-z0-9_@%#$]*/,

    anonymous_name: $ => ci('*N'),

    literal: $ => choice(
      $.number,
      $.string,
      $.indicator
    ),

    number: $ => /\d+(\.\d+)?/,

    string: $ => choice(
      seq(
        "'",
        repeat(/[^']/),
        "'"),
      seq(
        '"',
        repeat(/[^"]/),
        '"'
      ),
    ),


    indicator: $ => /\*[A-Za-z0-9]+/,

    comment: $ => token(choice(
      seq('//', /.*/),
      seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')
    )),
  }
});
