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

(dcl_ds
  name: (identifier) @type.definition)

(dcl_pr
  name: (identifier) @function.prototype)

(dcl_pi
  name: (identifier) @variable.parameter)

(procedure
  name: (identifier) @function)

(parameter
  name: (identifier) @variable.parameter)

(subfield
  name: (identifier) @property)

(subfield
  type: (type_expression) @type)

(subfield
  type: (psds_types) @type.builtin)

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
(keyword_arguments) @punctuation.bracket

; =========================
; Anonymous names (*N)
; =========================
(anonymous_name) @constant.builtin
