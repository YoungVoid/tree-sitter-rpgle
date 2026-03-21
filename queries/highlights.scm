; =========================
; Comments
; =========================
(comment) @comment

; =========================
; Keywords
; =========================
(keyword) @keyword

; Control flow keywords (optional refinement)
; [
;   "IF" "ELSE" "ELSEIF"
;   "DOU" "DOW" "FOR" "FOR-EACH"
;   "SELECT" "WHEN" "WHEN-IS" "WHEN-IN" "OTHER"
;   "ENDDO" "ENDFOR" "ENDSL"
;   "BEGSR" "ENDSR"
;   "DCL-PROC" "END-PROC"
;   "DCL-PI" "END-PI"
;   "DCL-PR" "END-PR"
;   "DCL-DS" "END-DS"
; ] @keyword.control

; =========================
; Types
; =========================
(type_keyword) @type

(builtin_type) @type
(qualified_type) @type

; =========================
; Identifiers
; =========================
(identifier) @variable

; Definitions (names)
(dcl_s
  name: (identifier) @variable.definition)

(dcl_c
  name: (identifier) @constant)

(dcl_ds_block
  name: (identifier) @type.definition)

(dcl_ds_inline
  name: (identifier) @type.definition)

(dcl_pr_block
  name: (identifier) @function)

(dcl_pr_inline
  name: (identifier) @function)

(dcl_pi
  name: (identifier) @function)

(procedure
  name: (identifier) @function)

(parameter
  name: (identifier) @parameter)

(ds_subfield
  name: (identifier) @property)

; =========================
; Function calls
; =========================
(function_call
  name: (identifier) @function.call)

; =========================
; Field access
; =========================
(field_access
  field: (identifier) @property)

; =========================
; Literals
; =========================
(number) @number
(string) @string
(indicator) @constant.builtin

; =========================
; Operators
; =========================
; [
;   "+"
;   "-"
;   "*"
;   "/"
;   "="
;   "<>"
;   "<"
;   "<="
;   ">"
;   ">="
; ] @operator

; Logical operators (word-based)
; [
;   "AND"
;   "OR"
;   "NOT"
;   "IN"
; ] @operator

; =========================
; Delimiters
; =========================
; [
;   "("
;   ")"
;   ";"
;   ":"
;   "."
; ] @punctuation.delimiter

; =========================
; Special constructs
; =========================
(compiler_directive) @preproc

(fully_free) @preproc

; =========================
; Keywords inside keyword nodes
; =========================
(keyword
  name: (identifier) @keyword)

; Keyword arguments
(keyword_argument) @punctuation.bracket

; =========================
; Anonymous names (*N)
; =========================
(anonymous_name) @constant.builtin
