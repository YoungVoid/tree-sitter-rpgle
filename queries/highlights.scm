; ======================
; Comments
; ======================

(comment) @comment

; ======================
; Keywords
; ======================

[
  "ctl-opt"
] @keyword

(compiler_directive) @keyword
(fully_free) @keyword

; Declaration keywords (matched via regex tokens)
(dcl_f) @keyword
(dcl_s) @keyword
(dcl_ds) @keyword
(dcl_pr) @keyword
(dcl_pi) @keyword
(procedure) @keyword

(keyword_d_spec_fixed) @keyword
(keyword) @keyword

; Control flow
;[
;  "if"
;  "elseif" "else" "endif"
;  "select" "when" "when-is" "when-in" "other" "endsl"
;  "dow" "dou" "enddo"
;  "for" "to" "by" "endfor"
;  "monitor" "on-error" "endmon"
;  "return"
;] @keyword

; ======================
; Types
; ======================

(type) @type

;[
;  "char" "varchar" "packed" "zoned"
;  "int" "ind" "date" "time" "timestamp"
;] @type.builtin

; ======================
; Functions & Procedures
; ======================

(procedure
  (identifier) @function)

(function_call
  (identifier) @function.call)

(builtin) @function.builtin

(call_statement
  (identifier) @function.call)

; ======================
; Variables
; ======================

(field_declaration
  (identifier) @variable.member)

(parameter
  (field_reference) @parameter)

(assignment
  (field_reference) @variable)

(identifier) @variable

; ======================
; Literals
; ======================

(string) @string
(number) @number
(literal) @constant

(special_value) @constant

; ======================
; Operators
; ======================

;[
;  "+" "-" "*" "/"
;  "=" "<>" "<" ">" "<=" ">="
;] @operator

;[
;  "and" "or" "not"
;] @keyword.operator

; ======================
; Native operands
; ======================

(native_operand) @function.builtin

; ======================
; SQL Block
; ======================

(sql_block) @string.special
