/**
 * @file Parser for RPGLE
 * @author Nian Vrey <51823073+YoungVoid@users.noreply.github.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

function caseInsensitive(word) {
  return new RegExp(
    word
      .split('')
      .map(char => {
        if (/[a-zA-Z]/.test(char)) {
          return `[${char.toLowerCase()}${char.toUpperCase()}]`;
        }
        // Escape special regex characters
        return char.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      })
      .join('')
  );
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
      repeat(seq($.keyword_h_spec,)),
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
    dcl_ds: $ => prec.right(choice(
      // 
      seq(
        token(prec(2, caseInsensitive('dcl-ds'))),
        $.identifier,
        repeat($.keyword_d_spec),
        ';',
        optional(repeat($.field_declaration)),
        optional(seq(
          token(caseInsensitive('end-ds')),
          optional($.field_reference),
          ';'
        )),
      ),
    )),

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

    type: $ => prec(2, choice(
      seq(caseInsensitive('BINDEC'), '(', $.number, optional(seq(':', $.number)), ')'),
      seq(caseInsensitive('CHAR'), '(', $.number, ')'),
      // seq(caseInsensitive('DATE'), optional(seq('(', choice($.special_value, choice('/','-',',','.','&')), ')'))),
      seq(caseInsensitive('FLOAT'), '(', $.number, ')'),
      seq(caseInsensitive('GRAPH'), '(', $.number, ')'),
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
    )),


    // https://www.ibm.com/docs/en/i/7.6.0?topic=specifications-control-specification-keywords
    keyword_h_spec: $ => choice(
      seq(caseInsensitive('ACTGRP'), '(', choice(caseInsensitive('*STGMDL'), caseInsensitive('*NEW'), caseInsensitive('*CALLER'), $.string, $.identifier), ')', ),
      seq(caseInsensitive('ALLOC'), '(', choice(caseInsensitive('*STGMDL'), caseInsensitive('*TERASPACE'), caseInsensitive('*SNGLVL')), ')',),
      seq(caseInsensitive('ALTSEQ'), optional(seq('(', choice(caseInsensitive('*NONE'), caseInsensitive('*SRC'), caseInsensitive('*EXT')),')'))),
      seq(caseInsensitive('ALWNULL'), '(', choice(caseInsensitive('*NO'), caseInsensitive('*INPUTONLY'), caseInsensitive('*USRCTL')), ')'),
      seq(caseInsensitive('AUT'), '(', choice(caseInsensitive('*LIBRCRTAUT'), caseInsensitive('*ALL'), caseInsensitive('*CHANGE'), caseInsensitive('*USE'), caseInsensitive('*EXCLUDE'), $.string, $.identifier),')'),
      seq(caseInsensitive('BNDDIR'), '(', choice($.string, $.identifier), optional(seq(':', choice($.string, $.identifier))), ')',), 
      seq(caseInsensitive('COPYNEST'), '(', $.number,')', ),
      seq(caseInsensitive('CCSID'), '(', 
        choice( 
          caseInsensitive('*EXACT'), 
          seq(caseInsensitive('*CHAR'), ':', choice(caseInsensitive('*JOBRUN'), caseInsensitive('*JOBRUNMIX'), caseInsensitive('*UTF8'), caseInsensitive('*HEX'), $.number)), 
          seq(caseInsensitive('*GRAPH'), ':',  choice(caseInsensitive('*JOBRUN'), caseInsensitive('*SRC'), caseInsensitive('*HEX'), caseInsensitive('*IGNORE'), $.number)), 
          seq(caseInsensitive('*UCS2'), ':',  choice(caseInsensitive('*UTF16'), $.number)),), 
        ')', ),
      seq(caseInsensitive('CCSIDCVT'), '(', caseInsensitive('*EXCP'), caseInsensitive('*LIST'), ')', ),
      seq(caseInsensitive('COPYRIGHT'), '(', $.string, ')', ),
      seq(caseInsensitive('CURSYM'), '(', $.string, ')', ),
      seq(caseInsensitive('CVTOPT'), '(', colonSep(choice(caseInsensitive('*DATETIME'), caseInsensitive('*NODATETIME'), caseInsensitive('*GRAPHIC'), caseInsensitive('*NOGRAPHIC'), caseInsensitive('*VARCHAR'), caseInsensitive('*NOVARCHAR'), caseInsensitive('*VARGRAPHIC'), caseInsensitive('*NOVARGRAPHIC'))), ')', ),
      seq(caseInsensitive('DATEDIT'), '(', $.special_value, optional(choice('/','.',',','&')), ')',),
      seq(caseInsensitive('DATEYY'), '(', choice(caseInsensitive('*ALLOW'), caseInsensitive('*WARN'), caseInsensitive('*NOALLOW')), ')'),
      seq(caseInsensitive('DATFMT'), '(', $.special_value, optional(choice('/','.',',','&')), ')',),
      seq(caseInsensitive('DCLOPT'), '(', caseInsensitive('*NOCHGDSLEN'), ')', ),
      seq(caseInsensitive('DEBUG'), optional(seq('(',colonSep(choice(caseInsensitive('*DUMP'), caseInsensitive('*INPUT'), caseInsensitive('*RETVAL'), caseInsensitive('*XMLSAX'), caseInsensitive('*NO'), caseInsensitive('*YES'))), ')', ))),
      seq(caseInsensitive('DECEDIT'), '(', choice(caseInsensitive('*JOBRUN'), $.string, $.identifier), ')'),
      seq(caseInsensitive('DFTACTGRP'), '(', choice(caseInsensitive('*YES'), caseInsensitive('*NO')), ')',),
      seq(caseInsensitive('DFTNAME'), '(', $.identifier, ')',),
      seq(caseInsensitive('ENBPFRCOL'), '(', choice(caseInsensitive('*PEP'), caseInsensitive('*ENTRYEXIT'), caseInsensitive('*FULL')), ')', ),
      seq(caseInsensitive('EXPROPTS'), '(', choice(caseInsensitive('*MAXDIGITS'), caseInsensitive('*RESDECPOS'), caseInsensitive('*ALWBLANKNUM'), caseInsensitive('*USEDECEDIT')), ')',),
      seq(caseInsensitive('EXTBININT'), optional(seq('(', choice(caseInsensitive('*NO'), caseInsensitive('*YES')),')'))),
      seq(caseInsensitive('FIXNBR'), '(', colonSep(choice(caseInsensitive('*ZONED'),caseInsensitive('*NOZONED'), caseInsensitive('*INPUTPACKED'), caseInsensitive('*NOINPUTPACKED'))), ')',),
      seq(caseInsensitive('FLTDIV'), optional(seq('(', choice(caseInsensitive('*NO'), caseInsensitive('*YES')), ')',))),
      seq(caseInsensitive('FORMSALIGN'), optional(seq('(', choice(caseInsensitive('*NO'), caseInsensitive('*YES')), ')',))),
      seq(caseInsensitive('FTRANS'), optional(seq('(', choice(caseInsensitive('*NONE'), caseInsensitive('*SRC')), ')',))),
      seq(caseInsensitive('GENLVL'), '(', $.number,')', ),
      seq(caseInsensitive('INDENT'), '(', choice(caseInsensitive('*NONE'), $.string, $.identifier), ')', ),
      seq(caseInsensitive('INTPREC'), '(', $.number, ')', ),
        seq(caseInsensitive('LANGID'), '(', choice(caseInsensitive('*JOBRUN'), caseInsensitive('*JOB'), $.string, $.identifier), ')', ),
        seq(caseInsensitive('MAIN'), '(', $.identifier, ')',),
        seq(caseInsensitive('NOMAIN'), 
          seq(caseInsensitive('OPENOPT'),  '(', colonSep(choice(caseInsensitive('*INZOFL'),caseInsensitive('*NOINZOFL'), caseInsensitive('*CVTDATA'),caseInsensitive('*NOCVTDATA'))), ')', ),
          seq(caseInsensitive('OPTIMIZE'), '(', choice(caseInsensitive('*NONE'), caseInsensitive('*BASIC'), caseInsensitive('*FULL')), ')',),
          seq(caseInsensitive('OPTION'), '(', colonSep(choice(
            caseInsensitive('*XREF'),caseInsensitive('*NOXREF'),
            caseInsensitive('*GEN') ,caseInsensitive('*NOGEN') ,
            caseInsensitive('*SECLVL') ,caseInsensitive('*NOSECLVL') ,
            caseInsensitive('*SHOWCPY') ,caseInsensitive('*NOSHOWCPY') ,
            caseInsensitive('*EXPDDS') ,caseInsensitive('*NOEXPDDS') ,
            caseInsensitive('*EXT') ,caseInsensitive('*NOEXT') ,
            caseInsensitive('*SHOWSKP'),caseInsensitive('*NOSHOWSKP'),
            caseInsensitive('*SRCSTMT'),caseInsensitive('*NOSRCSTMT'),
            caseInsensitive('*DEBUGIO'),caseInsensitive('*NODEBUGIO'),
            caseInsensitive('*UNREF'),caseInsensitive('*NOUNREF'),
          )), ')',),
          seq(caseInsensitive('PRFDTA'), '(', choice(caseInsensitive('*NOCOL'), caseInsensitive('*COL')), ')', ),
          seq(caseInsensitive('REQPREXP'), '(', choice(caseInsensitive('*NO'), caseInsensitive('*WARN'), caseInsensitive('*REQUIRE')), ')',),
          seq(caseInsensitive('SRTSEQ'), '(', choice(caseInsensitive('*HEX'), caseInsensitive('*JOB'), caseInsensitive('*JOBRUN'), caseInsensitive('*LANGIDUNQ'), caseInsensitive('*LANGIDSHR'), $.string, $.identifier)), ')',),
        seq(caseInsensitive('TEXT'), '(', choice(caseInsensitive('*SRCMBRTXT'), caseInsensitive('*BLANK'), $.string, $.identifier), ')',),
        seq(caseInsensitive('THREAD'), '(', choice(caseInsensitive('*CONCURRENT'), caseInsensitive('*SERIALIZE')), ')'),
        seq(caseInsensitive('TIMFMT'), '(', $.special_value, optional(choice(':','.',',','&')), ')',),
        seq(caseInsensitive('TRUNCNBR'), '(', choice(caseInsensitive('*NO'), caseInsensitive('*YES')), ')',),
        seq(caseInsensitive('USRPRF'), '(', choice(caseInsensitive('*USER'), caseInsensitive('*OWNER')), ')', ),
        seq(caseInsensitive('VALIDATE'), '(', caseInsensitive('*NODATETIME'), ')', ),
      ),


    keyword_f_spec: $ => choice(
      caseInsensitive('ALIAS'),
      seq(caseInsensitive('BLOCK'), '(', choice(caseInsensitive('*YES'), caseInsensitive('*NO')), ')'),
      seq(caseInsensitive('COMMIT'),optional(seq('(', choice($.identifier, '0', '1'), ')'))),
      seq(caseInsensitive('CHARCOUNT'), '(', choice(caseInsensitive('*NATURAL'), caseInsensitive('*STDCHARSIZE')), ')', ),
      seq(caseInsensitive('DATA'),'(', choice(caseInsensitive('*CVT'), caseInsensitive('*NOCVT')), ')', ),
      seq(caseInsensitive('DATFMT'), '(', $.special_value, optional(choice('/','.',',','&')), ')',),
      seq(caseInsensitive('DEVID'), '(', $.identifier, ')', ),
      seq(caseInsensitive('DISK'), optional(seq('(', choice(caseInsensitive('*EXT'), $.identifier, $.literal), ')', ))),
      seq(caseInsensitive('EXTDESC'),'(', choice($.identifier, $.string), ')',),
      seq(caseInsensitive('EXTFILE'),'(', choice($.identifier, $.string, caseInsensitive('*EXTDESC')), ')', ),
      seq(caseInsensitive('EXTIND'),'(', $.indicator, ')', ),
      seq(caseInsensitive('EXTMBR'),'(', choice($.identifier, $.string), ')',),
      seq(caseInsensitive('FORMLEN'),'(', $.number, ')', ),
      seq(caseInsensitive('FORMOFL'),'(', $.number, ')', ),
      seq(caseInsensitive('HANDLER'),'(', choice($.identifier, $.string), optional($.identifier), ')',),
      seq(caseInsensitive('IGNORE'),'(', $.identifier, optional(colonSep($.identifier)), ')', ),
      seq(caseInsensitive('INCLUDE'),'(', $.identifier, optional(colonSep($.identifier)), ')', ),
      seq(caseInsensitive('INDDS'),'(', $.identifier, ')',),
      seq(caseInsensitive('INFDS'),'(', $.identifier, ')',),
      seq(caseInsensitive('INFSR'),'(', $.identifier, ')',),
      seq(caseInsensitive('KEYED'), optional(seq('(', caseInsensitive('*CHAR'), ':', $.number, ')'))),
      seq(caseInsensitive('KEYLOC'),'(', $.number, ')'),
      seq(caseInsensitive('LIKEFILE'),'(', choice($.identifier, $.string), ')',),
      seq(caseInsensitive('MAXDEV'),'(', choice('*ONLY', '*FILE'), ')'),
      seq(caseInsensitive('OFLIND'),'(', $.indicator, ')',),
      seq(caseInsensitive('PASS'),'(', '*NOIND', ')'),
      seq(caseInsensitive('PGMNAME'),'(', choice($.identifier, $.string), ')',),
      seq(caseInsensitive('PLIST'),'(', $.identifier, ')',),
      seq(caseInsensitive('PREFIX'),'(', $.identifier, optional(seq(':', $.number)), ')',),
      seq(caseInsensitive('PRINTER'),optional(seq('(', choice(caseInsensitive('*EXT'), $.number, $.identifier), ')'))),
      seq(caseInsensitive('PRTCTL'),'(', $.identifier, optional(seq(':', caseInsensitive('*COMPAT'))), ')',),
      caseInsensitive('QUALIFIED'),
      seq(caseInsensitive('RAFDATA'),'(', choice($.identifier, $.string), ')',),
      seq(caseInsensitive('RECNO'),'(', choice($.identifier, $.string), ')',),
      seq(caseInsensitive('RENAME'),'(', choice($.identifier, $.string),':', choice($.identifier, $.string), ')'),
      seq(caseInsensitive('SAVEDS'),'(', $.identifier, ')',),
      seq(caseInsensitive('SAVEIND'),'(', $.number, ')',),
      seq(caseInsensitive('SEQ'),optional(seq('(', choice(caseInsensitive('*EXT'), $.number), ')'))),
      seq(caseInsensitive('SFILE'),'(', $.identifier,':',$.identifier, ')',),
      seq(caseInsensitive('SLN'),'(', $.number, ')'),
      seq(caseInsensitive('SPECIAL'),optional(seq('(',choice(caseInsensitive('*EXT'), $.number, ')')))),
      caseInsensitive('STATIC'),
      caseInsensitive('TEMPLATE'),
      seq(caseInsensitive('TIMFMT'),'(',$.special_value, optional(choice(':','.',',','&')), ')',),
      seq(caseInsensitive('USAGE'),'(', optional(colonSep(choice(caseInsensitive('*INPUT'), caseInsensitive('*OUTPUT'), caseInsensitive('*UPDATE'), caseInsensitive('*DELETE'),))),')',),
      caseInsensitive('USROPN'),
      seq(caseInsensitive('WORKSTN'),optional(seq('(', choice(caseInsensitive('*EXT'), $.number, $.identifier), ')'))),
    ),

    keyword_d_spec: $ => choice(
      caseInsensitive('ALIAS'),
      seq(caseInsensitive('ALIGN'), optional(seq('(', caseInsensitive('*FULL'), ')', ))),
      seq(caseInsensitive('ALT'), '(', $.identifier, ')', ),
      seq(caseInsensitive('ALTSEQ'), '(', caseInsensitive('*NONE'),')',),
      caseInsensitive('ASCEND'), 
      seq(caseInsensitive('BASED'), '(', $.identifier, ')', ),
      seq(caseInsensitive('BINDEC'), '(', $.number, optional(seq(':', $.number)), ')',),
      seq(caseInsensitive('CHAR'), '(', $.number, ')', ),
      seq(caseInsensitive('CCSID'), '(', 
        choice( 
          caseInsensitive('*EXACT'), 
          seq(caseInsensitive('*CHAR'), ':', choice(caseInsensitive('*JOBRUN'), caseInsensitive('*JOBRUNMIX'), caseInsensitive('*UTF8'), caseInsensitive('*HEX'), $.number)), 
          seq(caseInsensitive('*GRAPH'), ':',  choice(caseInsensitive('*JOBRUN'), caseInsensitive('*SRC'), caseInsensitive('*HEX'), caseInsensitive('*IGNORE'), $.number)), 
          seq(caseInsensitive('*UCS2'), ':',  choice(caseInsensitive('*UTF16'), $.number)),), 
        ')', ),
      seq(caseInsensitive('CLASS'), '(', caseInsensitive('*JAVA'), ':', choice($.special_value, $.string), ')'),

      // TODO: When specifying the value of a named constant, the CONST keyword itself is optional. That is, the constant value can be specified with or without the CONST keyword.
      //       Hence, Need to check that constants have their type defined correctly in cases with and without CONST
      seq(caseInsensitive('CONST'), optional(seq('(', choice($.number, $.identifier, $.string, $.builtin), ')'))),

      caseInsensitive('CTDATA'), 
      seq(caseInsensitive('DATE'), optional(seq('(', choice($.special_value, choice('/','-',',','.','&')), ')'))),
      seq(caseInsensitive('DATFMT'), '(', $.special_value, optional(choice('/','.',',','&')), ')',),
      caseInsensitive('DESCEND'), 
      caseInsensitive('DFT'),
      seq(caseInsensitive('DIM'), '(', optional(choice(seq(choice(caseInsensitive('*AUTO'), caseInsensitive('*VAR')), ':', choice($.identifier, $.number, $.builtin)), caseInsensitive('*CTDATA'))), ')',),
      // NOTE: DTAARA has different defs between dcl-s/sub-f and dcl-ds. also different on fixed-form.
      seq(caseInsensitive('DTAARA'), optional(seq('(', colonSep(choice($.identifier, $.string, caseInsensitive('*AUTO'), caseInsensitive('*USRCTL'))), ')', ))),
      seq(caseInsensitive('EXPORT'), optional(seq('(', choice($.identifier, $.string), ')',))),
      caseInsensitive('EXT'), 
      seq(caseInsensitive('EXTFLD'), optional(seq('(', choice($.identifier, $.string), ')',))),
      seq(caseInsensitive('EXTFMT'), '(', choice(
        caseInsensitive('B'), 
        caseInsensitive('C'), 
        caseInsensitive('I'), 
        caseInsensitive('L'), 
        caseInsensitive('R'), 
        caseInsensitive('P'), 
        caseInsensitive('S'), 
        caseInsensitive('U'), 
        caseInsensitive('F'), 
      ), ')', ),
      seq(caseInsensitive('EXTNAME'), '(', choice($.identifier, $.string), optional(choice(seq(':',choice($.identifier, $.string)),seq(':',choice(caseInsensitive('*ALL'), caseInsensitive('*INPUT'), caseInsensitive('*OUTPUT'), caseInsensitive('*KEY'), caseInsensitive('*NULL'))))), ')',),
      seq(caseInsensitive('EXTPGM'), optional(seq('(', choice($.identifier, $.string), ')',))),
      seq(caseInsensitive('EXTPROC'), optional(seq('(', choice(
        seq(caseInsensitive('*CL'), ':'),
        seq(caseInsensitive('*CWIDEN'), ':'),
        seq(caseInsensitive('*CNOWIDEN'), ':'),
        seq(caseInsensitive('*JAVA'), ':', choice($.identifier, $.string), ':'),
      ), choice(caseInsensitive('*DCLCASE'), $.identifier, $.string), ')', ))),
      seq(caseInsensitive('FLOAT'), '(', $.number, ')', ),
      seq(caseInsensitive('FROMFILE'), '(', $.identifier, ')', ),
      seq(caseInsensitive('GRAPH'), '(', $.number, ')', ),
      seq(caseInsensitive('IMPORT'), optional(seq('(', choice($.identifier, $.string), ')',))),
      caseInsensitive('IND'), 
      seq(caseInsensitive('INT'), '(', $.number, ')', ),
      seq(caseInsensitive('INZ'), optional(seq('(', choice($.identifier, $.string, $.number), ')'))),
      seq(caseInsensitive('LEN'), '(', $.number, ')', ),
      seq(caseInsensitive('LIKE'), '(', choice($.identifier, $.string), optional(seq(':', choice('+', '-'), $.number,)), ')', ),
      seq(caseInsensitive('LIKEDS'), '(', $.identifier, ')', ),
      seq(caseInsensitive('LIKEFILE'), '(', choice($.identifier, $.string), ')', ),
      seq(caseInsensitive('LIKEREC'), '(', choice($.identifier, $.string), optional(seq(':', choice($.identifier, $.string))), ')',),
      caseInsensitive('NOOPT'), 
      seq(caseInsensitive('NULLIND'), '(', $.identifier, ')',),
      seq(caseInsensitive('OCCURS'), '(', $.number, ')', ),
      caseInsensitive('OPDESC'), 
      seq(caseInsensitive('OBJECT'), optional(seq('(', caseInsensitive('*JAVA'), optional(colonSep(choice($.special_value, $.string))), ')'))),
      seq(caseInsensitive('OPTIONS'), '(', colonSep(choice(caseInsensitive('*NOPASS'), caseInsensitive('*OMIT'), caseInsensitive('*VARSIZE'), caseInsensitive('*EXACT'), caseInsensitive('*STRING'), caseInsensitive('*TRIM'), caseInsensitive('*RIGHTADJ'), caseInsensitive('*NULLIND'), caseInsensitive('*CONVERT'))), ')', ),
      seq(caseInsensitive('OVERLAY'), '(', $.identifier, optional(seq(':', choice($.number, caseInsensitive('*NEXT')))), ')',),
      seq(caseInsensitive('OVERLOAD'), '(', colonSep($.identifier), ')'),
      seq(caseInsensitive('PACKED'), '(', $.number,  optional(seq(':', $.number)), ')'),
      caseInsensitive('PACKEVEN'), 
      seq(caseInsensitive('PERRCD'), '(', $.number, ')', ),
      seq(caseInsensitive('POINTER'), optional(seq('(', caseInsensitive('*PROC'), ')',))),
      seq(caseInsensitive('POS'), '(', choice($.number, $.identifier), ')', ),
      //
      // TODO: Cater for PREFIX in GOTO Def requests
      seq(caseInsensitive('PREFIX'), '(', choice($.identifier, $.string), optional(seq(':', $.number)), ')',),
      caseInsensitive('PROCPTR'), 
      caseInsensitive('PSDS'), 
      caseInsensitive('QUALIFIED'), 
      seq(caseInsensitive('REQPROTO'), '(', caseInsensitive('*NO'), ')', ),
      caseInsensitive('RTNPARM'), 
      seq(caseInsensitive('SAMEPOS'), '(', $.identifier, ')', ),
      seq(caseInsensitive('STATIC'), optional(seq('(', caseInsensitive('*ALLTHREAD'), ')',))),
      caseInsensitive('TEMPLATE'), 
      seq(caseInsensitive('TIME'), optional(seq('(', choice($.special_value, choice(':','.',',','&')), ')'))),
      seq(caseInsensitive('TIMESTAMP'), optional(seq('(', $.number, ')'))),
      seq(caseInsensitive('TIMFMT'), '(', $.special_value, optional(choice(':','.',',','&')), ')',),
      seq(caseInsensitive('TOFILE'), '(', choice($.identifier, $.string), ')', ),
      seq(caseInsensitive('UCS2'), '(', $.number, ')', ),
      seq(caseInsensitive('UNS'), '(', $.number, ')', ),
      caseInsensitive('VALUE'), 
      seq(caseInsensitive('VARCHAR'), '(', choice($.identifier, $.number), optional(seq(':', choice('2', '4'))), ')'),
      seq(caseInsensitive('VARGRAPH'), '(', choice($.identifier, $.number), optional(seq(':', choice('2', '4'))), ')'),
      seq(caseInsensitive('VARUCS2'), '(', choice($.identifier, $.number), optional(seq(':', choice('2', '4'))), ')'),
      seq(caseInsensitive('VARYING'), '(', choice('2', '4'), ')'),
      seq(caseInsensitive('ZONED'), '(', $.number, optional(seq(':', $.number)),')',),
    ),

    keyword_p_spec: $ => choice($.special_value, 'TODO:'),

    special_value: $ => /\*[A-Za-z][A-Za-z0-9_]*/,

    indicator: $ => /\*[iI][nN]([0-9]{2})|\*[lL][rR]|[uU][1-8]/,

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

        // https://www.ibm.com/docs/en/i/7.6.0?topic=words-symbolic-names#symbol9
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
